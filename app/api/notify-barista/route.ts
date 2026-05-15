import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { order } = await request.json()

    if (!order) {
      return NextResponse.json({ error: 'Order is required' }, { status: 400 })
    }

    const { GMAIL_USER, GMAIL_APP_PASSWORD, BARISTA_EMAIL } = process.env

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !BARISTA_EMAIL) {
      console.error("Missing email configuration.")
      return NextResponse.json({ error: 'Missing email configuration' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })

    // Sipariş verenin kimliği
    const customerInfo = order.isGuest 
      ? 'Misafir (Guest)' 
      : 'Kayıtlı Kullanıcı'

    const mailOptions = {
      from: `"Coffee & Code" <${GMAIL_USER}>`,
      to: BARISTA_EMAIL,
      subject: `🚨 Yeni Sipariş: #${order.orderNumber} - ${order.itemName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d97706; text-align: center;">Yeni Bir Sipariş Geldi! ☕</h2>
          <p style="text-align: center; color: #666;">Şu an çevrimdışı olduğunuz için bu bildirim e-posta olarak gönderildi.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>Sipariş No:</strong> #${order.orderNumber}</p>
            <p><strong>Ürün:</strong> ${order.itemName}</p>
            <p><strong>Müşteri:</strong> ${customerInfo}</p>
            <p><strong>Fiyat:</strong> ${order.price || 'Bilinmiyor'}</p>
            
            <h3 style="margin-bottom: 5px;">Detaylar:</h3>
            <ul style="margin-top: 5px;">
              <li><strong>Sertlik:</strong> ${order.coffeeStrength}</li>
              <li><strong>Şeker:</strong> ${order.sugarLevel}/5</li>
              <li><strong>Shot:</strong> ${order.shot}</li>
              <li><strong>Bardak:</strong> ${order.cupType} ${order.cupSize ? `(${order.cupSize})` : ''}</li>
              ${order.milkType ? `<li><strong>Süt:</strong> ${order.milkType}</li>` : ''}
              ${order.chocolateType ? `<li><strong>Çikolata:</strong> ${order.chocolateType}</li>` : ''}
              ${order.syrups && order.syrups.length > 0 ? `<li><strong>Şuruplar:</strong> ${order.syrups.join(', ')}</li>` : ''}
            </ul>

            ${order.note ? `
              <div style="background-color: #fffbeb; padding: 10px; border-left: 4px solid #f59e0b; margin-top: 15px;">
                <strong>Müşteri Notu:</strong> ${order.note}
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 12px; color: #9ca3af;">Coffee & Code Barista Notification System</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
