"""Каталог запчастей: получение, добавление, обновление. Поддержка фильтра по марке авто."""
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

def stock_status(stock):
    if stock == 0:
        return "out_of_stock"
    if stock <= 2:
        return "low_stock"
    return "in_stock"

def row_to_dict(r):
    return {
        "id": r[0], "article": r[1], "name": r[2], "brand": r[3],
        "price": r[4], "stock": r[5], "notes": r[6],
        "status": stock_status(r[5]),
        "created_at": r[7].isoformat() if r[7] else None,
        "shop_url": r[8],
        "car_brands": r[9] or "",
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        search = params.get("q", "")
        brand_filter = params.get("brand", "")  # напр. "toyota"

        base_select = """
            SELECT id, article, name, brand, price, stock, notes, created_at, shop_url, car_brands
            FROM articles
        """

        conditions = []
        args = []

        if search:
            conditions.append("(name ILIKE %s OR article ILIKE %s OR brand ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]

        if brand_filter and brand_filter != "all" and brand_filter != "universal":
            conditions.append("(car_brands ILIKE %s OR car_brands ILIKE %s)")
            args += [f"%{brand_filter}%", "%universal%"]

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        cur.execute(f"{base_select} {where} ORDER BY name", args)

        rows = cur.fetchall()
        items = [row_to_dict(r) for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"articles": items})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        cur.execute("""
            INSERT INTO articles (article, name, brand, price, stock, notes, shop_url, car_brands)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            body.get("article", ""), body.get("name", ""), body.get("brand", ""),
            int(body.get("price", 0)), int(body.get("stock", 0)),
            body.get("notes", ""), body.get("shop_url", ""),
            body.get("car_brands", "universal"),
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        item_id = body.get("id")
        cur.execute("""
            UPDATE articles
            SET name=%s, brand=%s, price=%s, stock=%s, notes=%s, shop_url=%s, car_brands=%s
            WHERE id=%s
        """, (
            body.get("name"), body.get("brand"),
            int(body.get("price", 0)), int(body.get("stock", 0)),
            body.get("notes", ""), body.get("shop_url", ""),
            body.get("car_brands", "universal"), item_id,
        ))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
