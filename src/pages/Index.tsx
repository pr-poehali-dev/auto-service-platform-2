import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

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

const MOCK_CARS = [
  { id: 1, vin: "XTA211440L2158000", brand: "Lada", model: "Vesta", year: 2020, client: "Иванов А.В.", color: "#c0392b" },
  { id: 2, vin: "WBA3A5C55FF953411", brand: "BMW", model: "3 Series", year: 2019, client: "Петров С.И.", color: "#2c3e50" },
  { id: 3, vin: "1HGBH41JXMN109186", brand: "Honda", model: "Civic", year: 2021, client: "Сидоров П.П.", color: "#e67e22" },
];

const MOCK_ARTICLES = [
  { id: 1, article: "BP-2134", name: "Тормозные колодки передние", brand: "Brembo", price: 3200, stock: 8, status: "in_stock" },
  { id: 2, article: "FF-5521", name: "Масляный фильтр", brand: "Mann", price: 450, stock: 24, status: "in_stock" },
  { id: 3, article: "SP-7892", name: "Свечи зажигания (к-т)", brand: "NGK", price: 1800, stock: 0, status: "out_of_stock" },
  { id: 4, article: "TR-3300", name: "Амортизатор передний", brand: "KYB", price: 5600, stock: 2, status: "low_stock" },
  { id: 5, article: "BE-1190", name: "Ремень ГРМ", brand: "Gates", price: 2100, stock: 6, status: "in_stock" },
];

const MOCK_ORDERS = [
  { id: "ORD-001", client: "Иванов А.В.", car: "Lada Vesta", date: "05.04.2026", amount: 12400, status: "in_work" },
  { id: "ORD-002", client: "Петров С.И.", car: "BMW 3 Series", date: "04.04.2026", amount: 34800, status: "ready" },
  { id: "ORD-003", client: "Сидоров П.П.", car: "Honda Civic", date: "03.04.2026", amount: 8700, status: "done" },
  { id: "ORD-004", client: "Козлов Р.А.", car: "Toyota Camry", date: "02.04.2026", amount: 15200, status: "waiting" },
];

const MOCK_CART = [
  { id: 1, article: "BP-2134", name: "Тормозные колодки передние", brand: "Brembo", price: 3200, qty: 2 },
  { id: 2, article: "FF-5521", name: "Масляный фильтр", brand: "Mann", price: 450, qty: 1 },
  { id: 3, article: "TR-3300", name: "Амортизатор передний", brand: "KYB", price: 5600, qty: 1 },
];

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

  const startScan = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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
          { icon: "Car", label: "Автомобилей в гараже", value: "3", color: "text-blue-400" },
          { icon: "ClipboardList", label: "Активных заказов", value: "2", color: "text-orange-400" },
          { icon: "Package", label: "Позиций в каталоге", value: "5", color: "text-purple-400" },
          { icon: "TrendingUp", label: "Выручка за месяц", value: "₽ 71 100", color: "text-green-400" },
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
            {MOCK_ORDERS.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-body text-foreground">{o.client}</div>
                  <div className="text-xs text-muted-foreground font-body">{o.car}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-body font-medium text-foreground">₽ {o.amount.toLocaleString()}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">Заканчиваются запчасти</h3>
            <Icon name="AlertTriangle" size={14} className="text-yellow-400" />
          </div>
          <div className="space-y-2">
            {MOCK_ARTICLES.filter((a) => a.stock <= 2).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-body text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground font-body">{a.article} · {a.brand}</div>
                </div>
                <div className="text-xs font-body font-semibold text-yellow-400">{a.stock} шт.</div>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-body text-foreground">Свечи зажигания (к-т)</div>
                <div className="text-xs text-muted-foreground font-body">SP-7892 · NGK</div>
              </div>
              <div className="text-xs font-body font-semibold text-red-400">0 шт.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GarageSection() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Гараж</h2>
          <p className="text-sm text-muted-foreground font-body">Автомобили клиентов и история обслуживания</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
          <Icon name="Plus" size={16} />
          Добавить авто
        </button>
      </div>

      <div className="grid gap-4">
        {MOCK_CARS.map((car) => (
          <div key={car.id} className="bg-card border border-border rounded-xl p-5 card-hover">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${car.color}25`, border: `1px solid ${car.color}40` }}
                >
                  <Icon name="Car" size={22} style={{ color: car.color }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">{car.client} · {car.year} г.</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-body text-xs text-muted-foreground tracking-widest">VIN</div>
                <div className="font-body text-xs text-foreground tracking-wider">{car.vin}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="text-xs font-body px-3 py-1.5 bg-secondary rounded-lg text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1.5">
                <Icon name="History" size={12} />
                История
              </button>
              <button className="text-xs font-body px-3 py-1.5 bg-secondary rounded-lg text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1.5">
                <Icon name="ClipboardList" size={12} />
                Новый заказ
              </button>
              <button className="text-xs font-body px-3 py-1.5 bg-secondary rounded-lg text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1.5">
                <Icon name="Search" size={12} />
                Подобрать запчасти
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticlesSection() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_ARTICLES.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.article.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Артикулы</h2>
          <p className="text-sm text-muted-foreground font-body">Каталог запчастей и комплектующих</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
          <Icon name="Plus" size={16} />
          Добавить
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по названию или артикулу..."
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[100px_1fr_80px_80px_120px] gap-0 text-xs text-muted-foreground font-body uppercase tracking-wider px-5 py-3 border-b border-border bg-secondary/30">
          <span>Артикул</span>
          <span>Название</span>
          <span className="text-center">Бренд</span>
          <span className="text-right">Цена</span>
          <span className="text-right">Наличие</span>
        </div>
        {filtered.map((a, i) => (
          <div
            key={a.id}
            className={`flex flex-col md:grid md:grid-cols-[100px_1fr_80px_80px_120px] gap-2 md:gap-0 items-start md:items-center px-5 py-3.5 transition-all hover:bg-secondary/40 cursor-pointer ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}
          >
            <span className="font-body text-xs text-muted-foreground tracking-wider">{a.article}</span>
            <span className="font-body text-sm text-foreground">{a.name}</span>
            <span className="font-body text-xs text-muted-foreground md:text-center">{a.brand}</span>
            <span className="font-body text-sm font-semibold text-foreground md:text-right">₽ {a.price.toLocaleString()}</span>
            <div className="md:text-right">
              <StatusBadge status={a.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersSection() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground uppercase">Заказы</h2>
          <p className="text-sm text-muted-foreground font-body">Управление заказами клиентов</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-body font-semibold flex items-center gap-2 hover:brightness-110 transition-all">
          <Icon name="Plus" size={16} />
          Новый заказ
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "В работе", count: 1, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Ожидает", count: 1, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "Готов", count: 1, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Выдан", count: 1, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground font-body mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="bg-card border border-border rounded-xl p-5 card-hover cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                  <Icon name="FileText" size={18} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-semibold text-foreground text-sm">{order.id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-muted-foreground font-body mt-0.5">{order.client} · {order.car}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-bold text-foreground">₽ {order.amount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-body">{order.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartSection() {
  const total = MOCK_CART.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground uppercase">Корзина</h2>
        <p className="text-sm text-muted-foreground font-body">Товары для оформления заказа</p>
      </div>

      <div className="space-y-3">
        {MOCK_CART.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="Package" size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-medium text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground font-body">{item.article} · {item.brand}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 bg-secondary rounded-lg text-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center">
                <Icon name="Minus" size={12} />
              </button>
              <span className="w-6 text-center font-body text-sm font-semibold text-foreground">{item.qty}</span>
              <button className="w-7 h-7 bg-secondary rounded-lg text-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center">
                <Icon name="Plus" size={12} />
              </button>
            </div>
            <div className="text-right min-w-[80px]">
              <div className="font-body font-semibold text-foreground text-sm">₽ {(item.price * item.qty).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground font-body">× {item.price.toLocaleString()}</div>
            </div>
            <button className="text-muted-foreground hover:text-red-400 transition-colors ml-1">
              <Icon name="X" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-body text-muted-foreground text-sm">Итого позиций:</span>
          <span className="font-body text-foreground text-sm">{MOCK_CART.length} шт.</span>
        </div>
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
          <span className="font-body font-semibold text-foreground">Итого к оплате:</span>
          <span className="font-display text-2xl font-bold text-primary">₽ {total.toLocaleString()}</span>
        </div>
        <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-body font-semibold text-sm hover:brightness-110 transition-all active:scale-95">
          Оформить заказ
        </button>
      </div>
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
          {NAV_ITEMS.filter((n) => n.badge).map((item) => (
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
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium ${
                  active === item.id ? "active" : "text-sidebar-foreground"
                }`}
              >
                <Icon name={item.icon as "Home"} size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
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
