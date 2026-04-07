"""Каталог запчастей: получение, добавление, обновление остатков."""
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
        search = params.get("q", "")
        if search:
            cur.execute("""
                SELECT id, article, name, brand, price, stock, notes, created_at
                FROM articles
                WHERE name ILIKE %s OR article ILIKE %s
                ORDER BY name
            """, (f"%{search}%", f"%{search}%"))
        else:
            cur.execute("""
                SELECT id, article, name, brand, price, stock, notes, created_at
                FROM articles ORDER BY name
            """)
        rows = cur.fetchall()

        def stock_status(stock):
            if stock == 0:
                return "out_of_stock"
            if stock <= 2:
                return "low_stock"
            return "in_stock"

        items = [
            {
                "id": r[0], "article": r[1], "name": r[2], "brand": r[3],
                "price": r[4], "stock": r[5], "notes": r[6],
                "status": stock_status(r[5]),
                "created_at": r[7].isoformat() if r[7] else None
            }
            for r in rows
        ]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"articles": items})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        cur.execute("""
            INSERT INTO articles (article, name, brand, price, stock, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            body.get("article", ""), body.get("name", ""), body.get("brand", ""),
            int(body.get("price", 0)), int(body.get("stock", 0)), body.get("notes", "")
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        item_id = body.get("id")
        cur.execute("""
            UPDATE articles SET name=%s, brand=%s, price=%s, stock=%s, notes=%s
            WHERE id=%s
        """, (
            body.get("name"), body.get("brand"),
            int(body.get("price", 0)), int(body.get("stock", 0)),
            body.get("notes", ""), item_id
        ))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
