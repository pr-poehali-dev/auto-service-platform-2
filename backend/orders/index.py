"""Управление заказами: список, создание, смена статуса."""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute("""
            SELECT id, order_number, client_name, car_id, car_label, amount, status, notes, created_at, updated_at
            FROM orders ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        items = [
            {
                "id": r[0], "order_number": r[1], "client_name": r[2],
                "car_id": r[3], "car_label": r[4], "amount": r[5],
                "status": r[6], "notes": r[7],
                "created_at": r[8].isoformat() if r[8] else None,
                "updated_at": r[9].isoformat() if r[9] else None,
            }
            for r in rows
        ]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"orders": items})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM orders")
        next_id = cur.fetchone()[0]
        order_number = f"ORD-{next_id:03d}"
        cur.execute("""
            INSERT INTO orders (order_number, client_name, car_id, car_label, amount, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, order_number
        """, (
            order_number,
            body.get("client_name", ""),
            body.get("car_id"),
            body.get("car_label", ""),
            int(body.get("amount", 0)),
            body.get("status", "waiting"),
            body.get("notes", "")
        ))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": row[0], "order_number": row[1], "ok": True})}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        order_id = body.get("id")
        cur.execute("""
            UPDATE orders SET status=%s, amount=%s, notes=%s, updated_at=NOW()
            WHERE id=%s
        """, (body.get("status"), int(body.get("amount", 0)), body.get("notes", ""), order_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
