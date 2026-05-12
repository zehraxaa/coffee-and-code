# Supabase Veritabanı Kurulum Rehberi

Bu rehber, Coffee & Code projenizin tamamlanması için Supabase'de veritabanı ve tabloları nasıl oluşturacağınızı adım adım anlatır.

---

## Supabase'de Veritabanı Oluşturma

### Önemli Not
Supabase'de "veritabanı" zaten oluşturulmuş durumdadır. Sizin yapacağınız, bu veritabanı içinde **tablolar** oluşturmak veya var olan tabloları **genişletmek**tir.

### Supabase'e Erişim
1. [supabase.com](https://supabase.com) adresine git
2. Sağ üst köşede projenizi seç
3. SQL Editor veya Table Editor seçeneklerine erişebilirsin

---

## Yöntem 1: SQL Editor (Önerilen) — Hepsi Bir Seferde

### Adımlar

1. **Supabase Dashboard'u aç**
   - Projenize gir
   - Sol sidebar'dan **SQL Editor** seçeneğine tıkla

2. **Aşağıdaki SQL kodunu yapıştır ve çalıştır**

```sql
-- 1. Menu Items Tablosu
create table if not exists menu_items (
  id text primary key,
  name text not null,
  description text,
  price int not null,
  popular boolean default false,
  category text not null check (category in ('hot','iced')),
  image_url text,
  created_at timestamptz default now()
);

-- 2. Product Images Tablosu
create table if not exists product_images (
  id serial primary key,
  menu_item_id text references menu_items(id) on delete cascade,
  image_url text not null,
  alt_text text,
  created_at timestamptz default now()
);

-- 3. Stores Tablosu
create table if not exists stores (
  id serial primary key,
  name text not null,
  address text,
  phone text,
  city text,
  lat numeric,
  lng numeric,
  open_hours text,
  created_at timestamptz default now()
);

-- 4. Coffee of Month Tablosu
create table if not exists coffee_of_month (
  id serial primary key,
  name text not null,
  description text,
  origin text,
  image_url text,
  updated_at timestamptz default now()
);

-- 5. Barista Settings Tablosu
create table if not exists barista_settings (
  id serial primary key,
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- 6. Coupons Tablosu
create table if not exists coupons (
  id serial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  code text not null unique,
  status text not null default 'active', -- active, redeemed, expired
  issued_at timestamptz default now(),
  redeemed_at timestamptz,
  expires_at timestamptz
);

-- 7. Order Number Sequence (Merkezi Sipariş Numaralandırması)
create sequence if not exists order_number_seq start 1;

-- 8. order_number_seq'i kullanan RPC fonksiyonu
create or replace function next_order_number() returns integer language sql as $$
  select nextval('order_number_seq');
$$;

-- 9. Profiles tablosunu genişlet (eğer henüz bu alanlar yoksa)
alter table profiles
  add column if not exists loyalty_stamps int default 0,
  add column if not exists free_coffee_code text,
  add column if not exists coupon_count int default 0;

-- 10. RLS (Row Level Security) politikaları
-- Menu Items herkese açık
alter table menu_items enable row level security;
create policy "Menu items are viewable by everyone" on menu_items
  for select using (true);

-- Coffee of Month herkese açık
alter table coffee_of_month enable row level security;
create policy "Coffee of month viewable by everyone" on coffee_of_month
  for select using (true);

-- Stores herkese açık
alter table stores enable row level security;
create policy "Stores are viewable by everyone" on stores
  for select using (true);

-- Coupons: Kullanıcı sadece kendi kuponlarını görebilir
alter table coupons enable row level security;
create policy "Users can view their own coupons" on coupons
  for select using (auth.uid() = profile_id);
create policy "Users can update their own coupons" on coupons
  for update using (auth.uid() = profile_id);
```

3. **Çalıştır**
   - Üst sağ köşedeki **"Run"** veya **"Execute"** butonu tıkla
   - Tüm tablolar ve fonksiyonlar oluşturulacak

---

## Yöntem 2: Supabase UI (Tablo Tablo)

Eğer SQL kullanmak istemiyorsan, UI üzerinden de yapabilirsin:

### 1. Menu Items Tablosu

1. Sol sidebar'dan **Table Editor** → **+ Create a new table**
2. Tablo adı: `menu_items`
3. Sütunlar:
   - `id` (Text, Primary Key)
   - `name` (Text, not null)
   - `description` (Text, nullable)
   - `price` (Integer, not null)
   - `popular` (Boolean, default: false)
   - `category` (Text, not null) — constraint: 'hot' veya 'iced'
   - `image_url` (Text, nullable)
   - `created_at` (Timestamptz, default: now())

### 2. Stores Tablosu

1. **+ Create a new table** → `stores`
2. Sütunlar:
   - `id` (Integer, Primary Key, auto-increment)
   - `name` (Text, not null)
   - `address` (Text, nullable)
   - `phone` (Text, nullable)
   - `city` (Text, nullable)
   - `lat` (Numeric, nullable)
   - `lng` (Numeric, nullable)
   - `open_hours` (Text, nullable)
   - `created_at` (Timestamptz, default: now())

### 3. Coffee of Month Tablosu

1. **+ Create a new table** → `coffee_of_month`
2. Sütunlar:
   - `id` (Integer, Primary Key, auto-increment)
   - `name` (Text, not null)
   - `description` (Text, nullable)
   - `origin` (Text, nullable)
   - `image_url` (Text, nullable)
   - `updated_at` (Timestamptz, default: now())

### 4. Coupons Tablosu

1. **+ Create a new table** → `coupons`
2. Sütunlar:
   - `id` (Integer, Primary Key, auto-increment)
   - `profile_id` (UUID, Foreign Key → profiles.id)
   - `code` (Text, unique)
   - `status` (Text, default: 'active')
   - `issued_at` (Timestamptz, default: now())
   - `redeemed_at` (Timestamptz, nullable)
   - `expires_at` (Timestamptz, nullable)

---

## SQL Editor vs UI — Hangisini Seçmeli?

| Yöntem | Avantajlar | Dezavantajlar |
|--------|-----------|--------------|
| **SQL Editor** | ✅ Hepsi bir seferde<br/>✅ Hızlı<br/>✅ Constraints kolay<br/>✅ RLS politikaları kurulabilir | ❌ SQL bilgisi gerekli |
| **UI (Table Editor)** | ✅ Görsel & kolay<br/>✅ SQL bilgisi gerekmiyor | ❌ Tablo tablo yapmak yavaş<br/>❌ RLS politikaları manuel<br/>❌ Constraints zorlayıcı |

**Tavsiye: SQL Editor kullanın** — Daha hızlı ve profesyonel.

---

## Adım Adım SQL Editor Kullanımı

### 1. SQL Editor'u Aç
- Supabase Dashboard → Sol sidebar → **SQL Editor**

### 2. Kodları Yapıştır
Yukarıdaki "Yöntem 1" bölümündeki SQL kodunun tamamını kopyala.

### 3. Çalıştır
- **Run** veya **Execute** (keyboard: `Ctrl+Enter` veya `Cmd+Enter`)

### 4. Sonuç Kontrol Et
- Başarılı mesaj görürsen, tablolar oluşturulmuş
- Hata alırsan, hata mesajını oku ve düzelt

### 5. Tablolarını Kontrol Et
- Sol sidebar → **Table Editor**
- Yeni tabloların listelenip listelenmedini gör: 
  - `menu_items`
  - `stores`
  - `coffee_of_month`
  - `coupons`
  - vb.

---

## Sonra: Veriler Nasıl Eklenir?

### 1. Menu Items Verisini Ekle

```sql
insert into menu_items (id, name, description, price, popular, category, image_url) values
('spanish-latte', 'Spanish Latte', 'Sweet and creamier flavour, our special recipe', 120, true, 'hot', null),
('latte', 'Latte', 'Espresso with steamed milk and light foam', 100, true, 'hot', null),
('americano', 'Americano', 'Espresso with hot water', 100, false, 'hot', null),
('cappuccino', 'Cappuccino', 'Equal parts espresso, steamed milk, and foam', 100, false, 'hot', null),
('mocha', 'Mocha', 'Espresso with chocolate and steamed milk', 100, false, 'hot', null),
('espresso', 'Espresso', 'Classic Italian coffee shot', 100, false, 'hot', null),
('tea', 'Tea', 'Freshly brewed hot tea', 50, false, 'hot', null),
('iced-spanish-latte', 'Iced Spanish Latte', 'Sweet and refreshing creamier flavour over ice', 130, true, 'iced', null),
('iced-latte', 'Iced Latte', 'Espresso with cold milk poured over ice', 110, false, 'iced', null),
('iced-americano', 'Iced Americano', 'Espresso with cold water and ice', 110, false, 'iced', null),
('cold-brew', 'Cold Brew', 'Smooth, slowly steeped cold coffee', 120, true, 'iced', null),
('iced-mocha', 'Iced Mocha', 'Espresso with chocolate and cold milk over ice', 120, false, 'iced', null);
```

### 2. Stores Verisini Ekle

```sql
insert into stores (name, address, phone, city, open_hours) values
('Coffee & Code Üsküdar (Center)', 'Bağlarbaşı, Üsküdar', '(555) 123-4567', 'Üsküdar', '8:00 AM - 8:00 PM'),
('Coffee & Code Kadıköy', 'Kadıköy', '(555) 234-5678', 'Kadıköy', '8:00 AM - 9:00 PM'),
('Coffee & Code Beşiktaş', 'Beşiktaş', '(555) 345-6789', 'Beşiktaş', '7:30 AM - 7:00 PM'),
('Coffee & Code Maltepe', 'Maltepe', '(555) 456-7890', 'Maltepe', '6:30 AM - 10:00 PM');
```

### 3. Coffee of Month İlk Verisi (İsteğe Bağlı)

```sql
insert into coffee_of_month (name, description, origin) values
('Spanish Latte', 'Sweet and creamier flavour', 'Spain');
```

---

## Dikkat Edilmesi Gerekenler

### 1. Foreign Keys
- `coupons` tablosunun `profile_id` sütunu, `profiles` tablosunun `id` sütununa referans veriyor
- `profiles` tablosu Supabase tarafından otomatik oluşturulmuş

### 2. Constraints
- `category` sütununda sadece 'hot' veya 'iced' değerleri kabul edilir
- Başka değer girilirse hata verir

### 3. RLS (Row Level Security)
- Tablolardaki veriye erişim kuralları belirler
- `menu_items`, `stores`, `coffee_of_month`: Herkese açık (read-only)
- `coupons`: Kullanıcı sadece kendi kuponlarını görebilir
- `profiles`: Kullanıcı sadece kendi profilini görebilir (zaten kurulu)

### 4. Sequence (order_number_seq)
- Merkezi sipariş numarası dağıtmak için
- Her `next_order_number()` çağrılışında +1 artar

---

## Hata Çözümleri

### Hata: "relation already exists"
**Sebep:** Tablo zaten oluşturulmuş

**Çözüm:** Kodu şu şekilde değiştir:
```sql
create table if not exists table_name (...)
```
(Zaten `if not exists` kullanıyoruz, tekrar çalıştırabilirsin)

### Hata: "column already exists"
**Sebep:** Sütun zaten var

**Çözüm:** Kodu düzenle veya silelerdim:
```sql
alter table profiles drop column if exists column_name;
alter table profiles add column if not exists column_name type;
```

### Hata: "foreign key constraint"
**Sebep:** `profile_id` başka bir `profiles` kaydını referans vermiyor

**Çözüm:** Önce geçerli bir profil oluştur, sonra coupon ekle

---

## Sonraki Adım: Kodda Kullanma

Tablolar oluşturulduktan sonra, `app/barista/page.tsx`, `components/menu-view.tsx` vb. dosyalarda Supabase sorguları kullanarak veriyeri çekebilirsin.

**Örnek:**
```typescript
// Menu items Supabase'ten çek
const { data: menuItems, error } = await supabase
  .from('menu_items')
  .select('*')
```

---

## Kontrol Listesi

- [ ] SQL Editor açtım ve kodu yapıştırdım
- [ ] Kodu başarıyla çalıştırdım (hata yok)
- [ ] Table Editor'dan tüm tabloları gördüm
- [ ] Menu Items verisini ekledim
- [ ] Stores verisini ekledim
- [ ] RLS politikaları kuruldu (otomatik)
- [ ] order_number_seq sequence'i oluşturuldu
- [ ] Supabase'te "coffee_of_month" tablosu var ve çalışıyor

---

## Ek Kaynaklar

- [Supabase SQL Editor Docs](https://supabase.com/docs/guides/database/overview)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Sequence Docs](https://www.postgresql.org/docs/current/sql-createsequence.html)

---

**Sorun olursa, hata mesajını bana paylaş!**
