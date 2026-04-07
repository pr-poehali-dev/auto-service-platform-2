"""Корзина: получение, добавление, обновление количества, удаление позиций."""
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
            SELECT ci.id, ci.article_id, ci.qty, a.article, a.name, a.brand, a.price
            FROM cart_items ci
            JOIN articles a ON a.id = ci.article_id
            ORDER BY ci.added_at DESC
        """)
        rows = cur.fetchall()
        items = [
            {
                "id": r[0], "article_id": r[1], "qty": r[2],
                "article": r[3], "name": r[4], "brand": r[5], "price": r[6]
            }
            for r in rows
        ]
        total = sum(i["price"] * i["qty"] for i in items)
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"items": items, "total": total})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        article_id = body.get("article_id")
        cur.execute("SELECT id, qty FROM cart_items WHERE article_id = %s", (article_id,))
        existing = cur.fetchone()
        if existing:
            cur.execute("UPDATE cart_items SET qty = qty + 1 WHERE id = %s", (existing[0],))
        else:
            cur.execute("INSERT INTO cart_items (article_id, qty) VALUES (%s, 1)", (article_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        item_id = body.get("id")
        qty = int(body.get("qty", 1))
        if qty <= 0:
            cur.execute("UPDATE cart_items SET qty = 1 WHERE id = %s", (item_id,))
        else:
            cur.execute("UPDATE cart_items SET qty = %s WHERE id = %s", (qty, item_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    if method == "DELETE":
        item_id = params.get("id")
        cur.execute("UPDATE cart_items SET qty = 0 WHERE id = %s", (item_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
