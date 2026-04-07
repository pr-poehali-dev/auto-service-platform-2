import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, type Car, type Article, type Order, type CartItem } from "@/lib/api";

type Section =
  | "home"
  | "garage"
  | "articles"
  | "orders"
  | "cart"
  | "profile"
  | "stats"
  | "contacts";

const NAV_ITEMS: { id: Section; label: string; icon: string; badge?: number }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "garage", label: "Гараж", icon: "Car" },
  { id: "articles", label: "Артикулы", icon: "Package" },
  { id: "orders", label: "Заказы", icon: "ClipboardList" },
  { id: "cart", label: "Корзина", icon: "ShoppingCart", badge: 3 },
  { id: "profile", label: "Профиль", icon: "User", badge: 5 },
  { id: "stats", label: "Статистика", icon: "BarChart3" },
  { id: "contacts", label: "Контакты", icon: "Phone" },
];

function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    fn().then(setData).finally(() => setLoading(false));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    in_stock: { label: "В наличии", color: "bg-green-500/15 text-green-400 border-green-500/20" },
    out_of_stock: { label: "Нет в наличии", color: "bg-red-500/15 text-red-400 border-red-500/20" },
    low_stock: { label: "Заканчивается", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
    in_work: { label: "В работе", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    ready: { label: "Готов", color: "bg-green-500/15 text-green-400 border-green-500/20" },
    done: { label: "Выдан", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20" },
    waiting: { label: "Ожидает", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  };
  const s = map[status] || { label: status, color: "bg-zinc-500/15 text-zinc-400" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-body ${s.color}`}>
      {s.label}
    </span>
  );
}

function HomeSection({ onSearch }: { onSearch: (vin: string) => void }) {
  const [vin, setVin] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: carsData } = useApi(() => api.cars.list());
  const { data: ordersData } = useApi(() => api.orders.list());
  const { data: articlesData } = useApi(() => api.articles.list());

  const cars = carsData?.cars ?? [];
  const orders = ordersData?.orders ?? [];
  const articles = articlesData?.articles ?? [];
  const activeOrders = orders.filter((o) => o.status === "in_work" || o.status === "waiting");
  const lowStock = articles.filter((a) => a.stock <= 2);
  const totalRevenue = orders.filter((o) => o.status === "done").reduce((s, o) => s + o.amount, 0);

  const startScan = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setScanning(false);
      alert("Нет доступа к камере");
    }
  };

  const stopScan = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setScanning(false);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 220 }}>
        <img
          src="https://cdn.poehali.dev/projects/693575df-8572-4ad9-8d4d-811f0c32f615/files/298a6b94-3b47-4265-87cf-abf0569260c1.jpg"
          alt="Автосервис"
          className="w-full h-56 object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8">
          <p className="text-xs font-body tracking-widest text-primary uppercase mb-2">Платформа управления</p>
          <h1 className="font-display text-5xl font-bold text-foreground leading-tight mb-1">
            AUTO<span className="text-primary">PRO</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-xs">
            Поиск запчастей, управление заказами и гаражом клиентов
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-body tracking-widest text-muted-foreground uppercase">Поиск запчастей по VIN</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Введите VIN-код автомобиля..."
              className="vin-input w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-body tracking-wider text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all pr-14"
              maxLength={17}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-body">
              {vin.length}/17
            </span>
          </div>
          <button
            onClick={() => onSearch(vin)}
            className="bg-primary text-primary-foreground px-6 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
          >
            Найти
          </button>
          <button
            onClick={scanning ? stopScan : startScan}
            className={`px-4 rounded-xl border transition-all active:scale-95 ${
              scanning ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
            title="Сканировать VIN через камеру"
          >
            <Icon name="Camera" size={20} />
          </button>
        </div>

        {scanning && (
          <div className="relative rounded-xl overflow-hidden bg-card border border-primary/30">
            <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-4/5 h-14 border-2 border-primary rounded-lg opacity-80">
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-primary" />
              </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-xs text-primary font-body bg-background/80 px-3 py-1 rounded-full">Наведите камеру на VIN-код</span>
            </div>
            <button onClick={stopScan} className="absolute top-2 right-2 bg-background/80 rounded-lg px-3 py-1 text-xs text-foreground font-body">
              ✕ Закрыть
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: "Car", label: "Автомобилей в гараже", value: String(cars.length), color: "text-blue-400" },
          { icon: "ClipboardList", label: "Активных заказов", value: String(activeOrders.length), color: "text-orange-400" },
          { icon: "Package", label: "Позиций в каталоге", value: String(articles.length), color: "text-purple-400" },
          { icon: "TrendingUp", label: "Выручка (выдано)", value: totalRevenue > 0 ? `₽ ${totalRevenue.toLocaleString()}` : "—", color: "text-green-400" },
        ].map((item, i) => (
          <div key={i} className="stat-card p-4 card-hover cursor-pointer">
            <Icon name={item.icon as "Car"} size={22} className={`${item.color} mb-3`} />
            <div className="font-display text-xl font-bold text-foreground">{item.value}</div>
            <div className="text-xs text-muted-foreground font-body mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Последние заказы</h3>
            <Icon name="ArrowRight" size={14} className="text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {orders.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-body text-foreground">{o.client_name}</div>
                  <div className="text-xs text-muted-foreground font-body">{o.car_label}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-body font-medium text-foreground">₽ {o.amount.toLocaleString()}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-sm text-muted-foreground font-body py-2">Заказов пока нет</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Заканчиваются запчасти</h3>
            <Icon name="AlertTriangle" size={14} className="text-yellow-400" />
          </div>
          <div className="space-y-2">
            {lowStock.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-body text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground font-body">{a.article} · {a.brand}</div>
                </div>
                <div className={`text-xs font-body font-semibold ${a.stock === 0 ? "text-red-400" : "text-yellow-400"}`}>{a.stock} шт.</div>
              </div>
            ))}
            {lowStock.length === 0 && <div className="text-sm text-muted-foreground font-body py-2">Все запчасти в наличии</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function GarageSection() {
  const { data, loading, reload } = useApi(() => api.cars.list());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vin: "", brand: "", model: "", year: new Date().getFullYear(), client_name: "", client_phone: "", color: "#888888" });
  const [saving, setSaving] = useState(false);
  const cars: Car[] = data?.cars ?? [];

  const handleAdd = async () => {
    if (!form.vin || !form.brand || !form.model || !form.client_name) return;
    setSaving(true);
    await api.cars.add(form);
    setSaving(false);
    setShowForm(false);
    setForm({ vin: "", brand: "", model: "", year: new Date().getFullYear(), client_name: "", client_phone: "", color: "#888888" });
    reload();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Гараж</h2>
          <p className="text-sm text-muted-foreground font-body">Автомобили клиентов и история обслуживания</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
          <Icon name={showForm ? "X" : "Plus"} size={16} />
          {showForm ? "Отмена" : "Добавить авто"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3 animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Новый автомобиль</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })} placeholder="VIN-код*" maxLength={17}
              className="col-span-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all tracking-wider" />
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Марка*"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Модель*"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} placeholder="Год" type="number" min={1990} max={2030}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Клиент (ФИО)*"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="Телефон"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="grid gap-4">
          {cars.map((car) => (
            <div key={car.id} className="bg-card border border-border rounded-xl p-5 card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${car.color}25`, border: `1px solid ${car.color}40` }}>
                    <Icon name="Car" size={22} style={{ color: car.color }} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{car.brand} {car.model}</h3>
                    <p className="text-sm text-muted-foreground font-body">{car.client_name} · {car.year} г.</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-body text-xs text-muted-foreground tracking-widest">VIN</div>
                  <div className="font-body text-xs text-foreground tracking-wider">{car.vin}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="text-xs font-body px-3 py-1.5 bg-secondary rounded-lg text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1.5">
                  <Icon name="History" size={12} /> История
                </button>
                <button className="text-xs font-body px-3 py-1.5 bg-secondary rounded-lg text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1.5">
                  <Icon name="ClipboardList" size={12} /> Новый заказ
                </button>
              </div>
            </div>
          ))}
          {cars.length === 0 && <div className="text-center py-10 text-muted-foreground font-body text-sm">Нет автомобилей. Добавьте первый!</div>}
        </div>
      )}
    </div>
  );
}

function ArticlesSection() {
  const [search, setSearch] = useState("");
  const { data, loading, reload } = useApi(() => api.articles.list(search), [search]);
  const articles: Article[] = data?.articles ?? [];

  useEffect(() => { reload(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ article: "", name: "", brand: "", price: 0, stock: 0 });
  const [saving, setSaving] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const handleAdd = async () => {
    if (!form.article || !form.name) return;
    setSaving(true);
    await api.articles.add(form);
    setSaving(false);
    setShowForm(false);
    setForm({ article: "", name: "", brand: "", price: 0, stock: 0 });
    reload();
  };

  const handleAddToCart = async (a: Article) => {
    if (a.stock === 0) return;
    await api.cart.add(a.id);
    setAddedIds((prev) => new Set(prev).add(a.id));
    setTimeout(() => setAddedIds((prev) => { const s = new Set(prev); s.delete(a.id); return s; }), 1500);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Артикулы</h2>
          <p className="text-sm text-muted-foreground font-body">Каталог запчастей и комплектующих</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
          <Icon name={showForm ? "X" : "Plus"} size={16} />
          {showForm ? "Отмена" : "Добавить"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3 animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Новая запчасть</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.article} onChange={(e) => setForm({ ...form, article: e.target.value })} placeholder="Артикул*"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Бренд"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название*"
              className="col-span-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="Цена, ₽" type="number" min={0}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Остаток, шт." type="number" min={0}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию или артикулу..."
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all" />

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {articles.map((a) => {
            const isAdded = addedIds.has(a.id);
            const outOfStock = a.stock === 0;
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center gap-3 transition-all hover:border-border/80 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-sm font-medium text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground font-body hidden sm:inline">{a.article}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-body text-xs text-muted-foreground">{a.brand}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display text-base font-bold text-foreground">₽ {a.price.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-body">{a.stock} шт.</div>
                </div>
                <button
                  onClick={() => handleAddToCart(a)}
                  disabled={outOfStock}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isAdded
                      ? "bg-green-500/20 border border-green-500/30 text-green-400"
                      : outOfStock
                      ? "bg-secondary border border-border text-muted-foreground opacity-40 cursor-not-allowed"
                      : "bg-secondary border border-border text-muted-foreground hover:bg-primary/20 hover:border-primary/40 hover:text-primary active:scale-90"
                  }`}
                  title={outOfStock ? "Нет в наличии" : "В корзину"}
                >
                  <Icon name={isAdded ? "Check" : "ShoppingCart"} size={15} />
                </button>
              </div>
            );
          })}
          {articles.length === 0 && <div className="text-center py-10 text-muted-foreground font-body text-sm">Запчастей не найдено</div>}
        </div>
      )}
    </div>
  );
}

function OrdersSection() {
  const { data, loading, reload } = useApi(() => api.orders.list());
  const orders: Order[] = data?.orders ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_name: "", car_label: "", amount: 0, status: "waiting", notes: "" });
  const [saving, setSaving] = useState(false);

  const counts = {
    in_work: orders.filter((o) => o.status === "in_work").length,
    waiting: orders.filter((o) => o.status === "waiting").length,
    ready: orders.filter((o) => o.status === "ready").length,
    done: orders.filter((o) => o.status === "done").length,
  };

  const handleAdd = async () => {
    if (!form.client_name) return;
    setSaving(true);
    await api.orders.add(form);
    setSaving(false);
    setShowForm(false);
    setForm({ client_name: "", car_label: "", amount: 0, status: "waiting", notes: "" });
    reload();
  };

  const handleStatusChange = async (order: Order, newStatus: string) => {
    await api.orders.update({ id: order.id, status: newStatus, amount: order.amount, notes: order.notes ?? "" });
    reload();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Заказы</h2>
          <p className="text-sm text-muted-foreground font-body">Управление заказами клиентов</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
          <Icon name={showForm ? "X" : "Plus"} size={16} />
          {showForm ? "Отмена" : "Новый заказ"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3 animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Новый заказ</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Клиент (ФИО)*"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.car_label} onChange={(e) => setForm({ ...form, car_label: e.target.value })} placeholder="Автомобиль"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Сумма, ₽" type="number" min={0}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all">
              <option value="waiting">Ожидает</option>
              <option value="in_work">В работе</option>
              <option value="ready">Готов</option>
              <option value="done">Выдан</option>
            </select>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Комментарий" rows={2}
              className="col-span-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all resize-none" />
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? "Сохранение..." : "Создать заказ"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "В работе", count: counts.in_work, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Ожидает", count: counts.waiting, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "Готов", count: counts.ready, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Выдан", count: counts.done, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground font-body mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-5 card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Icon name="FileText" size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body font-semibold text-foreground text-sm">{order.order_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-muted-foreground font-body mt-0.5">{order.client_name} · {order.car_label}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-foreground">₽ {order.amount.toLocaleString()}</div>
                  <select value={order.status} onChange={(e) => handleStatusChange(order, e.target.value)}
                    className="mt-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs font-body text-foreground focus:outline-none focus:border-primary/60">
                    <option value="waiting">Ожидает</option>
                    <option value="in_work">В работе</option>
                    <option value="ready">Готов</option>
                    <option value="done">Выдан</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="text-center py-10 text-muted-foreground font-body text-sm">Заказов пока нет</div>}
        </div>
      )}
    </div>
  );
}

function CartSection() {
  const { data, loading, reload } = useApi(() => api.cart.list());
  const items: CartItem[] = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleQty = async (item: CartItem, delta: number) => {
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      await api.cart.remove(item.id);
    } else {
      await api.cart.update(item.id, newQty);
    }
    reload();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground uppercase">Корзина</h2>
        <p className="text-sm text-muted-foreground font-body">Товары для оформления заказа</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="space-y-3">
            {items.filter((i) => i.qty > 0).map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Package" size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-body">{item.article} · {item.brand}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleQty(item, -1)} className="w-7 h-7 bg-secondary rounded-lg text-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center">
                    <Icon name="Minus" size={12} />
                  </button>
                  <span className="w-6 text-center font-body text-sm font-semibold text-foreground">{item.qty}</span>
                  <button onClick={() => handleQty(item, 1)} className="w-7 h-7 bg-secondary rounded-lg text-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center">
                    <Icon name="Plus" size={12} />
                  </button>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="font-body font-semibold text-foreground text-sm">₽ {(item.price * item.qty).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-body">× {item.price.toLocaleString()}</div>
                </div>
                <button onClick={() => handleQty(item, -item.qty)} className="text-muted-foreground hover:text-red-400 transition-colors ml-1">
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
            {items.filter((i) => i.qty > 0).length === 0 && (
              <div className="text-center py-10 text-muted-foreground font-body text-sm">Корзина пуста</div>
            )}
          </div>

          {items.filter((i) => i.qty > 0).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-muted-foreground text-sm">Итого позиций:</span>
                <span className="font-body text-foreground text-sm">{items.filter((i) => i.qty > 0).length} шт.</span>
              </div>
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                <span className="font-body font-semibold text-foreground">Итого к оплате:</span>
                <span className="font-display text-2xl font-bold text-primary">₽ {total.toLocaleString()}</span>
              </div>
              <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all active:scale-95">
                Оформить заказ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfileSection() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground uppercase">Профиль</h2>
        <p className="text-sm text-muted-foreground font-body">Учётная запись и настройки</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Icon name="User" size={28} className="text-primary" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">Сергей Иванов</h3>
          <p className="text-sm text-muted-foreground font-body">Администратор · AutoPro Сервис</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-400 font-body">Онлайн</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-3">Уведомления</div>
        {[
          { icon: "Bell", text: "Заказ ORD-002 готов к выдаче", time: "10 мин назад", read: false },
          { icon: "Package", text: "Амортизатор KYB заканчивается (2 шт.)", time: "1 ч назад", read: false },
          { icon: "Car", text: "Новый автомобиль добавлен в гараж", time: "3 ч назад", read: true },
          { icon: "CheckCircle", text: "Заказ ORD-003 выдан клиенту", time: "Вчера", read: true },
          { icon: "AlertTriangle", text: "Свечи NGK отсутствуют на складе", time: "Вчера", read: true },
        ].map((n, i) => (
          <div key={i} className={`bg-card border rounded-xl p-4 flex items-start gap-3 ${n.read ? "border-border opacity-60" : "border-primary/30"}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? "bg-secondary" : "bg-primary/15"}`}>
              <Icon name={n.icon as "Bell"} size={15} className={n.read ? "text-muted-foreground" : "text-primary"} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-body text-foreground">{n.text}</div>
              <div className="text-xs text-muted-foreground font-body mt-0.5">{n.time}</div>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSection() {
  const months = ["Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр"];
  const revenue = [42000, 58000, 63000, 51000, 67000, 74000, 71100];
  const profit = [14000, 19000, 21000, 17000, 23000, 25000, 24000];
  const maxVal = Math.max(...revenue);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground uppercase">Статистика</h2>
        <p className="text-sm text-muted-foreground font-body">Выручка, прибыль и аналитика продаж</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Выручка (апрель)", value: "₽ 71 100", icon: "TrendingUp", color: "text-green-400", delta: "+6.9%", up: true },
          { label: "Прибыль (апрель)", value: "₽ 24 000", icon: "Wallet", color: "text-primary", delta: "+4.3%", up: true },
          { label: "Заказов за месяц", value: "18", icon: "ClipboardList", color: "text-blue-400", delta: "−2", up: false },
        ].map((s, i) => (
          <div key={i} className="stat-card p-5">
            <div className="flex items-center justify-between mb-3">
              <Icon name={s.icon as "TrendingUp"} size={18} className={s.color} />
              <span className={`text-xs font-body ${s.up ? "text-green-400" : "text-red-400"}`}>{s.delta}</span>
            </div>
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground font-body mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-5">Динамика за 7 месяцев</h3>
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: 112 }}>
                <div
                  className="flex-1 bg-primary/70 rounded-t-sm transition-all hover:bg-primary cursor-pointer"
                  style={{ height: `${(revenue[i] / maxVal) * 100}%` }}
                  title={`Выручка: ₽${revenue[i].toLocaleString()}`}
                />
                <div
                  className="flex-1 bg-blue-500/60 rounded-t-sm transition-all hover:bg-blue-400 cursor-pointer"
                  style={{ height: `${(profit[i] / maxVal) * 100}%` }}
                  title={`Прибыль: ₽${profit[i].toLocaleString()}`}
                />
              </div>
              <span className="text-xs text-muted-foreground font-body">{m}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary/70" /><span className="text-xs text-muted-foreground font-body">Выручка</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/60" /><span className="text-xs text-muted-foreground font-body">Прибыль</span></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Топ запчастей по продажам</h3>
        <div className="space-y-4">
          {[
            { name: "Тормозные колодки Brembo", count: 12, revenue: 38400 },
            { name: "Масляный фильтр Mann", count: 31, revenue: 13950 },
            { name: "Ремень ГРМ Gates", count: 6, revenue: 12600 },
            { name: "Амортизатор KYB", count: 2, revenue: 11200 },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-foreground">{item.name}</span>
                <span className="text-sm font-body font-semibold text-primary">₽ {item.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary rounded-full h-1.5 transition-all"
                  style={{ width: `${(item.revenue / 38400) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactsSection() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground uppercase">Контакты</h2>
        <p className="text-sm text-muted-foreground font-body">Информация о сервисе и способы связи</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/15 border border-primary/20 rounded-2xl flex items-center justify-center">
            <Icon name="Wrench" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">AutoPro Сервис</h3>
            <p className="text-sm text-muted-foreground font-body">Профессиональный автосервис и запчасти</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {[
          { icon: "MapPin", label: "Адрес", value: "г. Москва, ул. Автомобильная, 42" },
          { icon: "Phone", label: "Телефон", value: "+7 (495) 123-45-67" },
          { icon: "MessageCircle", label: "WhatsApp", value: "+7 (495) 123-45-67" },
          { icon: "Mail", label: "Email", value: "info@autopro-service.ru" },
          { icon: "Clock", label: "Режим работы", value: "Пн–Сб: 9:00 – 20:00" },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 card-hover cursor-pointer">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon as "MapPin"} size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-body">{item.label}</div>
              <div className="text-sm font-body font-medium text-foreground">{item.value}</div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-auto" />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Написать нам</h3>
        <div className="space-y-3">
          <input
            placeholder="Ваше имя"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all"
          />
          <input
            placeholder="Телефон или email"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all"
          />
          <textarea
            placeholder="Ваш вопрос или сообщение..."
            rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all resize-none"
          />
          <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all active:scale-95">
            Отправить сообщение
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [active, setActive] = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: cartData } = useApi(() => api.cart.list());
  const cartCount = cartData?.items.filter((i) => i.qty > 0).length ?? 0;

  const navItems = NAV_ITEMS.map((item) =>
    item.id === "cart" ? { ...item, badge: cartCount || undefined } : item
  );

  const renderSection = () => {
    switch (active) {
      case "home": return <HomeSection onSearch={(vin) => console.log("Search VIN:", vin)} />;
      case "garage": return <GarageSection />;
      case "articles": return <ArticlesSection />;
      case "orders": return <OrdersSection />;
      case "cart": return <CartSection />;
      case "profile": return <ProfileSection />;
      case "stats": return <StatsSection />;
      case "contacts": return <ContactsSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60 h-14 flex items-center px-4 gap-3">
        <button
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Icon name="Menu" size={20} />
        </button>

        <div className="font-display text-xl font-bold text-foreground tracking-wider">
          AUTO<span className="text-primary">PRO</span>
        </div>

        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="VIN, артикул или название..."
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {navItems.filter((n) => n.badge).map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`relative p-2.5 rounded-xl transition-all ${active === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <Icon name={item.icon as "Bell"} size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-body font-bold rounded-full flex items-center justify-center leading-none">
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 pt-14">
        <aside
          className={`fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-56 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium ${
                  active === item.id ? "active" : "text-sidebar-foreground"
                }`}
              >
                <Icon name={item.icon as "Home"} size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Icon name="User" size={14} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-body font-semibold text-sidebar-foreground truncate">Сергей И.</div>
                <div className="text-[10px] text-muted-foreground font-body">Администратор</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-5 lg:p-7 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}