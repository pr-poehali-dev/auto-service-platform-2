"""Управление автомобилями в гараже: получение, добавление, удаление."""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

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
