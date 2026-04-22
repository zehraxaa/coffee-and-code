# Deployment Rehberi

## Değişiklikleri Domain'e Entegre Etme

### 1. Git Push (Gerekli)
Değişiklikler commit edildi. Şimdi GitHub'a push yapın:

```bash
git push origin main
```

### 2. Otomatik Deployment (Vercel/Netlify)
Eğer Vercel veya Netlify kullanıyorsanız:
- GitHub'a push yaptığınızda otomatik olarak deploy olacak
- Deployment durumunu platformunuzun dashboard'undan kontrol edebilirsiniz

### 3. Manuel Deployment

#### Vercel için:
```bash
npm run build
vercel --prod
```

#### Netlify için:
```bash
npm run build
netlify deploy --prod
```

#### Kendi Sunucunuz için:
```bash
npm run build
npm start
```

## Yapılan Değişiklikler

1. ✅ Tab değiştiğinde sayfa en üste scroll oluyor
2. ✅ Siparişlerde fiyat bilgisi gösteriliyor
3. ✅ Tüm siparişler sabit 100 TL fiyatında

## Domain Ayarları

Domain'inizi bağlamak için:
- Vercel: Settings > Domains bölümünden domain ekleyin
- Netlify: Domain settings bölümünden domain ekleyin
- DNS kayıtlarınızı platformunuzun verdiği adreslere yönlendirin


