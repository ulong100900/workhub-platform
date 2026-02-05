// test-sms.js
const API_KEY = '19A24BB4-CCE8-3F10-7E57-811ED56FAB36' // ваш ключ
const phone = '+79991234567' // ваш номер для теста

async function testSMS() {
  try {
    const params = new URLSearchParams({
      api_id: API_KEY,
      to: phone,
      msg: 'Тестовое сообщение от WorkFinder',
      json: '1',
      from: 'WorkFinder'
    })

    console.log('Отправляю запрос к SMS.RU...')
    console.log('Параметры:', params.toString())

    const response = await fetch('https://sms.ru/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })

    const result = await response.json()
    console.log('Ответ от SMS.RU:', JSON.stringify(result, null, 2))
    
    if (result.status === 'OK') {
      console.log('✅ SMS успешно отправлено!')
      console.log('Стоимость:', result.sms[phone]?.cost || 'неизвестно', 'руб.')
      console.log('ID сообщения:', result.sms[phone]?.sms_id)
    } else {
      console.error('❌ Ошибка:', result.status_text)
      console.log('Код ошибки:', result.status_code)
    }
  } catch (error) {
    console.error('❌ Ошибка при вызове API:', error)
  }
}

testSMS()