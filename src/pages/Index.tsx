import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, type Car, type Article, type Order, type CartItem, type VinInfo } from "@/lib/api";

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
  const [vinInfo, setVinInfo] = useState<VinInfo | null>(null);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
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

  const handleVinSearch = async () => {
    if (vin.length !== 17) { setVinError("VIN должен содержать 17 символов"); return; }
    setVinError("");
    setVinInfo(null);
    setVinLoading(true);
    try {
      const result = await api.cars.decodeVin(vin);
      setVinInfo(result);
      onSearch(vin);
    } catch {
      setVinError("Не удалось получить данные. Проверьте VIN.");
    } finally {
      setVinLoading(false);
    }
  };

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
              onChange={(e) => { setVin(e.target.value.toUpperCase()); setVinInfo(null); setVinError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVinSearch()}
              placeholder="Введите VIN-код автомобиля..."
              className="vin-input w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-body tracking-wider text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all pr-14"
              maxLength={17}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-body">
              {vin.length}/17
            </span>
          </div>
          <button
            onClick={handleVinSearch}
            disabled={vinLoading}
            className="bg-primary text-primary-foreground px-6 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 min-w-[80px] justify-center"
          >
            {vinLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : "Найти"}
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

        {vinError && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-body animate-fade-in">
            <Icon name="AlertCircle" size={13} />
            {vinError}
          </div>
        )}

        {vinInfo && (
          <div className="bg-card border border-primary/25 rounded-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <Icon name="Car" size={16} className="text-primary" />
                <span className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
                  {vinInfo.make_display || vinInfo.make || "Неизвестный автомобиль"} {vinInfo.model}
                </span>
                {vinInfo.year && <span className="text-xs text-muted-foreground font-body">{vinInfo.year} г.</span>}
              </div>
              <div className="flex items-center gap-1.5">
                {vinInfo.valid
                  ? <span className="text-xs font-body text-green-400 flex items-center gap-1"><Icon name="CheckCircle" size={12} />VIN корректный</span>
                  : <span className="text-xs font-body text-yellow-400 flex items-center gap-1"><Icon name="AlertTriangle" size={12} />Возможна ошибка</span>
                }
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
              {[
                { label: "VIN", value: vinInfo.vin },
                { label: "Марка", value: vinInfo.make_display || vinInfo.make },
                { label: "Модель", value: vinInfo.model },
                { label: "Год", value: vinInfo.year },
                { label: "Серия", value: vinInfo.series },
                { label: "Кузов", value: vinInfo.body_class },
                { label: "Двигатель", value: vinInfo.displacement ? `${vinInfo.displacement}L ${vinInfo.cylinders ? `(${vinInfo.cylinders} цил.)` : ""}` : undefined },
                { label: "Топливо", value: vinInfo.fuel_type },
                { label: "Привод", value: vinInfo.drive_type },
                { label: "КПП", value: vinInfo.transmission },
                { label: "Страна", value: vinInfo.plant_country },
                { label: "Производитель", value: vinInfo.manufacturer },
              ].filter((r) => r.value).map((row, i) => (
                <div key={i} className="px-4 py-2.5 border-b border-r border-border/40 last:border-b-0">
                  <div className="text-xs text-muted-foreground font-body">{row.label}</div>
                  <div className="text-sm font-body font-medium text-foreground mt-0.5 truncate">{row.value}</div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border bg-secondary/20 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground font-body self-center">Найти запчасти:</span>
              {[
                { label: "Autodoc", url: vinInfo.autodoc_url, color: "hover:text-blue-400 hover:border-blue-400/40" },
                { label: "Stancebazztards", url: `https://stancebazztards.ru/index.php?route=product/search&search=${encodeURIComponent(vin)}`, color: "hover:text-orange-400 hover:border-orange-400/40" },
                { label: "Technobearing", url: `https://technobearing.ru/search/?q=${encodeURIComponent(vin)}`, color: "hover:text-purple-400 hover:border-purple-400/40" },
              ].map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-body text-muted-foreground transition-all ${s.color} hover:bg-secondary active:scale-95`}>
                  <Icon name="ExternalLink" size={11} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}

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

const CAR_BRANDS = [
  { id: "all", label: "Все марки", emoji: "🔧" },
  { id: "toyota", label: "Toyota", emoji: "🇯🇵" },
  { id: "bmw", label: "BMW", emoji: "🇩🇪" },
  { id: "volkswagen", label: "VW", emoji: "🇩🇪" },
  { id: "honda", label: "Honda", emoji: "🇯🇵" },
  { id: "hyundai", label: "Hyundai", emoji: "🇰🇷" },
  { id: "kia", label: "Kia", emoji: "🇰🇷" },
  { id: "mercedes", label: "Mercedes", emoji: "🇩🇪" },
  { id: "audi", label: "Audi", emoji: "🇩🇪" },
  { id: "lada", label: "Lada", emoji: "🇷🇺" },
];

const CATEGORIES = [
  { id: "all", label: "Все", icon: "Package" },
  { id: "brakes", label: "Тормоза", icon: "CircleDot", keywords: ["тормоз", "колодк", "диск", "суппорт", "барабан", "шланг тормоз"] },
  { id: "oil", label: "Масла", icon: "Droplets", keywords: ["масло", "антифриз", "жидкость", "омывател"] },
  { id: "filters", label: "Фильтры", icon: "Filter", keywords: ["фильтр"] },
  { id: "suspension", label: "Подвеска", icon: "Settings2", keywords: ["амортизатор", "стойка", "сайлентблок", "шаровая", "подшипник", "пружин", "рычаг", "наконечник", "тяга"] },
  { id: "engine", label: "Двигатель", icon: "Zap", keywords: ["ремень грм", "помпа", "ролик", "прокладка", "термостат", "сальник", "набор прокладок"] },
  { id: "ignition", label: "Зажигание", icon: "Flame", keywords: ["свеч", "катушка", "провода", "зажигани"] },
  { id: "transmission", label: "Трансмиссия", icon: "Cog", keywords: ["сцеплени", "шрус", "пыльник", "диск сцепл"] },
  { id: "exhaust", label: "Выхлоп", icon: "Wind", keywords: ["катализатор", "глушитель", "гофра", "хомут", "выпускного"] },
  { id: "electrical", label: "Электрика", icon: "Bolt", keywords: ["аккумулятор", "генератор", "стартер", "фара", "лампа", "датчик"] },
  { id: "cooling", label: "Охлаждение", icon: "Thermometer", keywords: ["радиатор", "вентилятор", "шланг радиатор"] },
  { id: "steering", label: "Рулевое", icon: "Steering", keywords: ["рейка", "насос гур", "жидкость гур", "рулевая"] },
  { id: "bearings", label: "Подшипники", icon: "Circle", keywords: ["подшипник 6", "роликоподшипник"] },
  { id: "sport", label: "Тюнинг", icon: "TrendingUp", keywords: ["спортивн", "bc racing", "eibach", "ap racing", "motul", "койловер"] },
];

const SHOPS = [
  { key: "autodoc", label: "Autodoc", color: "#3b82f6", url: (q: string) => `https://www.autodoc.ru/search/by-text/?search=${encodeURIComponent(q)}` },
  { key: "stance", label: "Stance", color: "#f97316", url: (q: string) => `https://stancebazztards.ru/index.php?route=product/search&search=${encodeURIComponent(q)}` },
  { key: "techno", label: "Technobearing", color: "#a855f7", url: (q: string) => `https://technobearing.ru/search/?q=${encodeURIComponent(q)}` },
];

function PriceCompareModal({ items, onClose }: { items: Article[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">Сравнение цен</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{items.length} позиций · цены в вашем каталоге vs. магазины</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card/95 backdrop-blur border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 font-body text-xs text-muted-foreground uppercase tracking-wider font-semibold">Запчасть</th>
                <th className="text-right px-3 py-3 font-body text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ваша цена</th>
                {SHOPS.map(s => (
                  <th key={s.key} className="text-center px-3 py-3 font-body text-xs uppercase tracking-wider font-semibold" style={{ color: s.color }}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={a.id} className={`border-b border-border/40 hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-body text-sm font-medium text-foreground leading-tight">{a.name}</div>
                    <div className="font-body text-xs text-muted-foreground mt-0.5">{a.article} · {a.brand}</div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className="font-display text-sm font-bold text-primary">₽ {a.price.toLocaleString()}</span>
                  </td>
                  {SHOPS.map(s => (
                    <td key={s.key} className="px-3 py-3.5 text-center">
                      <a
                        href={a.shop_url && a.shop_url.includes(s.key === "autodoc" ? "autodoc" : s.key === "stance" ? "stancebazztards" : "technobearing")
                          ? a.shop_url
                          : s.url(a.article)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium transition-all hover:opacity-80 active:scale-95"
                        style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}
                      >
                        <Icon name="ExternalLink" size={10} />
                        Найти
                      </a>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-body">Цены в магазинах могут отличаться от актуальных</span>
          <button onClick={onClose} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold hover:brightness-110 transition-all">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticlesSection() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBrand, setActiveBrand] = useState("all");

  // Реальный фильтр по марке через API
  const { data, loading, reload } = useApi(
    () => api.articles.list(search || undefined, activeBrand !== "all" ? activeBrand : undefined),
    [search, activeBrand]
  );
  const allArticles: Article[] = data?.articles ?? [];

  useEffect(() => { reload(); }, [search, activeBrand]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ article: "", name: "", brand: "", price: 0, stock: 0, car_brands: "universal", shop_url: "" });
  const [formBrands, setFormBrands] = useState<Set<string>>(new Set(["universal"]));
  const [saving, setSaving] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBrands, setEditBrands] = useState<Set<string>>(new Set());

  const handleAdd = async () => {
    if (!form.article || !form.name) return;
    setSaving(true);
    await api.articles.add({ ...form, car_brands: Array.from(formBrands).join(",") || "universal" });
    setSaving(false);
    setShowForm(false);
    setForm({ article: "", name: "", brand: "", price: 0, stock: 0, car_brands: "universal", shop_url: "" });
    setFormBrands(new Set(["universal"]));
    reload();
  };

  const handleSaveBrands = async (a: Article) => {
    await api.articles.update({ id: a.id, car_brands: Array.from(editBrands).join(",") || "universal" });
    setEditingId(null);
    reload();
  };

  const handleAddToCart = async (a: Article) => {
    if (a.stock === 0) return;
    await api.cart.add(a.id);
    setAddedIds((prev) => new Set(prev).add(a.id));
    setTimeout(() => setAddedIds((prev) => { const s = new Set(prev); s.delete(a.id); return s; }), 1500);
  };

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  // Фильтрация по категории — на клиенте (быстро)
  const byCategory = activeCategory === "all" ? allArticles : allArticles.filter((a) => {
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (!cat || !cat.keywords) return false;
    const hay = (a.name + " " + a.article).toLowerCase();
    return cat.keywords.some(k => hay.includes(k.toLowerCase()));
  });

  const articles = byCategory;
  const compareItems = allArticles.filter(a => compareIds.has(a.id));

  const brandLabel = (id: string) => CAR_BRANDS.find(b => b.id === id)?.label || id;
  const brandSearchUrl = (brand: string) =>
    `https://www.autodoc.ru/search/by-text/?search=${encodeURIComponent(brand + " " + search)}`;

  return (
    <div className="animate-fade-in space-y-5">
      {showCompare && compareItems.length > 0 && (
        <PriceCompareModal items={compareItems} onClose={() => setShowCompare(false)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Артикулы</h2>
          <p className="text-sm text-muted-foreground font-body">Каталог запчастей и комплектующих</p>
        </div>
        <div className="flex items-center gap-2">
          {compareIds.size > 0 && (
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-body font-semibold hover:bg-blue-500/25 transition-all animate-fade-in"
            >
              <Icon name="GitCompare" size={15} />
              Сравнить ({compareIds.size})
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
            <Icon name={showForm ? "X" : "Plus"} size={16} />
            {showForm ? "Отмена" : "Добавить"}
          </button>
        </div>
      </div>

      {/* Марки автомобилей */}
      <div className="space-y-2">
        <p className="text-xs font-body text-muted-foreground uppercase tracking-widest">Фильтр по марке авто</p>
        <div className="flex gap-2 flex-wrap">
          {CAR_BRANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => { setActiveBrand(b.id); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium border transition-all active:scale-95 ${
                activeBrand === b.id
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span>{b.emoji}</span>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Категории */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium border transition-all ${
              activeCategory === cat.id
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
          >
            <Icon name={cat.icon as "Package"} size={12} />
            {cat.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Новая запчасть</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.article} onChange={(e) => setForm({ ...form, article: e.target.value })} placeholder="Артикул*"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Производитель (Bosch, NGK…)"
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название запчасти*"
              className="col-span-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="Цена, ₽" type="number" min={0}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Остаток, шт." type="number" min={0}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
            <input value={form.shop_url} onChange={(e) => setForm({ ...form, shop_url: e.target.value })} placeholder="Ссылка на магазин (необязательно)"
              className="col-span-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition-all" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-body text-muted-foreground">Подходит для марок автомобилей:</p>
            <div className="flex gap-2 flex-wrap">
              {CAR_BRANDS.filter(b => b.id !== "all").map((b) => {
                const checked = formBrands.has(b.id) || formBrands.has("universal");
                const isUniversal = b.id === "universal";
                return (
                  <button key={b.id} type="button"
                    onClick={() => setFormBrands(prev => {
                      const s = new Set(prev);
                      if (s.has(b.id)) s.delete(b.id); else s.add(b.id);
                      return s;
                    })}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body border transition-all ${
                      formBrands.has(b.id) ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {b.emoji} {b.label}
                  </button>
                );
              })}
              <button type="button"
                onClick={() => setFormBrands(prev => {
                  const s = new Set(prev);
                  if (s.has("universal")) s.delete("universal"); else { s.clear(); s.add("universal"); }
                  return s;
                })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body border transition-all ${
                  formBrands.has("universal") ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-secondary border-border text-muted-foreground hover:border-green-500/30"
                }`}
              >
                🔧 Универсальная
              </button>
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}

      {/* Поиск */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveBrand("all"); }}
            placeholder="Поиск по названию, артикулу или бренду..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        {activeBrand !== "all" && (
          <a
            href={brandSearchUrl(search)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-body font-medium hover:bg-blue-500/20 transition-all whitespace-nowrap"
          >
            <Icon name="ExternalLink" size={13} />
            Autodoc
          </a>
        )}
      </div>

      {/* Список */}
      {loading ? <Spinner /> : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-body">{articles.length} позиций</span>
            {compareIds.size > 0 && (
              <button onClick={() => setCompareIds(new Set())} className="text-xs text-muted-foreground font-body hover:text-foreground transition-colors flex items-center gap-1">
                <Icon name="X" size={11} /> Сбросить выбор
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {articles.map((a) => {
              const isAdded = addedIds.has(a.id);
              const outOfStock = a.stock === 0;
              const inCompare = compareIds.has(a.id);
              const isEditing = editingId === a.id;
              const brands = (a.car_brands || "").split(",").filter(Boolean);
              const isUniversal = brands.includes("universal");

              return (
                <div key={a.id} className="flex flex-col">
                  <div className={`bg-card border rounded-xl px-4 py-3 flex items-center gap-3 transition-all ${
                    inCompare ? "border-blue-500/40 bg-blue-500/5" : isEditing ? "border-primary/40 rounded-b-none" : "border-border hover:border-border/80"
                  }`}>
                    <button onClick={() => toggleCompare(a.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        inCompare ? "bg-blue-500 border-blue-500 text-white" : "border-border hover:border-blue-400/50"
                      }`} title="Добавить к сравнению">
                      {inCompare && <Icon name="Check" size={11} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-sm font-medium text-foreground leading-tight">{a.name}</span>
                        <span className="text-xs text-muted-foreground font-mono hidden sm:inline opacity-60">{a.article}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-body text-xs text-muted-foreground">{a.brand}</span>
                        <StatusBadge status={a.status} />
                        {/* Бейджи марок */}
                        {isUniversal ? (
                          <span className="text-xs font-body px-1.5 py-0.5 bg-green-500/10 text-green-400/80 rounded border border-green-500/20">🔧 универсал</span>
                        ) : brands.slice(0, 4).map(bid => {
                          const bInfo = CAR_BRANDS.find(b => b.id === bid);
                          return bInfo ? (
                            <span key={bid} className="text-xs font-body px-1.5 py-0.5 bg-primary/8 text-primary/70 rounded border border-primary/20">{bInfo.emoji} {bInfo.label}</span>
                          ) : null;
                        })}
                        {!isUniversal && brands.length > 4 && (
                          <span className="text-xs text-muted-foreground font-body">+{brands.length - 4}</span>
                        )}
                        {a.shop_url && (
                          <a href={a.shop_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-body text-primary/60 hover:text-primary flex items-center gap-1 transition-colors">
                            <Icon name="ExternalLink" size={10} />в магазине
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[72px]">
                      <div className="font-display text-sm font-bold text-foreground">₽ {a.price.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground font-body">{a.stock} шт.</div>
                    </div>

                    {/* Кнопка редактировать марки */}
                    <button
                      onClick={() => {
                        if (isEditing) { setEditingId(null); return; }
                        setEditingId(a.id);
                        setEditBrands(new Set(brands));
                      }}
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isEditing ? "bg-primary/20 border border-primary/40 text-primary" : "bg-secondary border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                      }`}
                      title="Привязать к маркам авто"
                    >
                      <Icon name="Tags" size={13} />
                    </button>

                    <button onClick={() => handleAddToCart(a)} disabled={outOfStock}
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isAdded ? "bg-green-500/20 border border-green-500/30 text-green-400"
                        : outOfStock ? "bg-secondary border border-border text-muted-foreground opacity-30 cursor-not-allowed"
                        : "bg-secondary border border-border text-muted-foreground hover:bg-primary/20 hover:border-primary/40 hover:text-primary active:scale-90"
                      }`} title={outOfStock ? "Нет в наличии" : "В корзину"}>
                      <Icon name={isAdded ? "Check" : "ShoppingCart"} size={14} />
                    </button>
                  </div>

                  {/* Панель редактирования марок */}
                  {isEditing && (
                    <div className="bg-card border border-t-0 border-primary/40 rounded-b-xl px-4 py-3 animate-fade-in">
                      <p className="text-xs font-body text-muted-foreground mb-2">Выберите марки автомобилей для этой запчасти:</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {CAR_BRANDS.filter(b => b.id !== "all").map(b => (
                          <button key={b.id} type="button"
                            onClick={() => setEditBrands(prev => { const s = new Set(prev); if (s.has(b.id)) s.delete(b.id); else s.add(b.id); return s; })}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body border transition-all ${
                              editBrands.has(b.id) ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                            }`}>
                            {b.emoji} {b.label}
                          </button>
                        ))}
                        <button type="button"
                          onClick={() => setEditBrands(prev => { const s = new Set(prev); if (s.has("universal")) s.delete("universal"); else { s.clear(); s.add("universal"); } return s; })}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body border transition-all ${
                            editBrands.has("universal") ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-secondary border-border text-muted-foreground"
                          }`}>
                          🔧 Универсальная
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveBrands(a)}
                          className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-body font-semibold hover:brightness-110 transition-all">
                          Сохранить
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="bg-secondary text-muted-foreground px-4 py-1.5 rounded-lg text-xs font-body hover:text-foreground transition-all">
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {articles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-body text-sm space-y-2">
                <Icon name="PackageSearch" size={32} className="mx-auto opacity-30" />
                <p>Запчастей не найдено</p>
                {activeBrand !== "all" && (
                  <a href={brandSearchUrl(activeBrand !== "all" ? CAR_BRANDS.find(b=>b.id===activeBrand)?.label || "" : "")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline">
                    <Icon name="ExternalLink" size={13} />
                    Поискать на Autodoc
                  </a>
                )}
              </div>
            )}
          </div>
        </>
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