"""Управление автомобилями в гараже + декодирование VIN через NHTSA API."""
import json
import os
import urllib.request
import urllib.parse
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

MAKE_RU = {
    "BMW": "BMW", "MERCEDES-BENZ": "Mercedes-Benz", "AUDI": "Audi",
    "VOLKSWAGEN": "Volkswagen", "TOYOTA": "Toyota", "HONDA": "Honda",
    "FORD": "Ford", "CHEVROLET": "Chevrolet", "HYUNDAI": "Hyundai",
    "KIA": "Kia", "NISSAN": "Nissan", "MAZDA": "Mazda",
    "SUBARU": "Subaru", "VOLVO": "Volvo", "SKODA": "Skoda",
    "PORSCHE": "Porsche", "LAND ROVER": "Land Rover", "LEXUS": "Lexus",
    "INFINITI": "Infiniti", "MITSUBISHI": "Mitsubishi", "RENAULT": "Renault",
    "PEUGEOT": "Peugeot", "CITROEN": "Citroen", "FIAT": "Fiat",
    "LADA": "Lada", "GAZ": "ГАЗ", "UAZ": "УАЗ",
}

NHTSA_FIELDS = {
    "Make": "make", "Model": "model", "Model Year": "year",
    "Series": "series", "Vehicle Type": "vehicle_type",
    "Engine Number of Cylinders": "cylinders",
    "Displacement (L)": "displacement",
    "Fuel Type - Primary": "fuel_type",
    "Drive Type": "drive_type",
    "Transmission Style": "transmission",
    "Body Class": "body_class",
    "Manufacturer Name": "manufacturer",
    "Plant Country": "plant_country",
    "Error Code": "error_code",
    "Error Text": "error_text",
}


def decode_vin(vin: str) -> dict:
    url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{urllib.parse.quote(vin)}?format=json"
    req = urllib.request.Request(url, headers={"User-Agent": "AutoPro/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw = json.loads(resp.read().decode("utf-8"))
    result = {"vin": vin}
    for item in raw.get("Results", []):
        var = item.get("Variable", "")
        val = item.get("Value")
        if var in NHTSA_FIELDS and val and val != "Not Applicable":
            result[NHTSA_FIELDS[var]] = val
    if "make" in result:
        result["make_display"] = MAKE_RU.get(result["make"].upper(), result["make"])
    result["valid"] = result.get("error_code", "0") == "0"
    result["autodoc_url"] = f"https://www.autodoc.ru/search/by-vin/?vin={vin}"
    return result


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    # VIN декодирование: GET ?action=decode&vin=...
    if method == "GET" and params.get("action") == "decode":
        vin = params.get("vin", "").strip().upper()
        if len(vin) != 17:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "VIN должен содержать 17 символов"})}
        result = decode_vin(vin)
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps(result, ensure_ascii=False)}

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute("""
            SELECT id, vin, brand, model, year, client_name, client_phone, color, notes, created_at
            FROM cars ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        cars = [
            {
                "id": r[0], "vin": r[1], "brand": r[2], "model": r[3],
                "year": r[4], "client_name": r[5], "client_phone": r[6],
                "color": r[7], "notes": r[8],
                "created_at": r[9].isoformat() if r[9] else None
            }
            for r in rows
        ]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"cars": cars})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        cur.execute("""
            INSERT INTO cars (vin, brand, model, year, client_name, client_phone, color, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            body.get("vin", ""), body.get("brand", ""), body.get("model", ""),
            int(body.get("year", 2020)), body.get("client_name", ""),
            body.get("client_phone", ""), body.get("color", "#888888"),
            body.get("notes", "")
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

    if method == "DELETE":
        car_id = params.get("id")
        cur.execute("UPDATE cars SET notes = '[deleted]' WHERE id = %s", (car_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
