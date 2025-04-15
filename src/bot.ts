require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'do\'st';

    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '📝 Anonim xabar yuborish',
                        callback_data: 'send_message',
                    },
                    {
                        text: '👤 Admin haqida ma\'lumot',
                        callback_data: 'admin_info',
                    },
                    {
                        text: '📞 Kontakt',
                        callback_data: 'contact',
                    },
                ],
            ],
        },
    };

    bot.sendMessage(chatId, `Salom ${firstName}! 👋\n\nIltimos, quyidagi variantlardan birini tanlang:`, options);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const user = msg.from;

    if (text && text.startsWith('/') || chatId == ADMIN_ID) return;

    const firstName = user.first_name || 'Unknown';
    const lastName = user.last_name || 'Unknown';
    const username = user.username || 'User Name yo\'q';

    bot.sendMessage(chatId, `Salom ${firstName}, Anonim xabaringiz uchun rahmat!`);

    const adminMessage = {
        chat_id: ADMIN_ID,
        text: `📨 Yangi xabar!\n\n👤 Kimdan: ${firstName} ${lastName} (@${username})\n🆔 ID: ${chatId}\n✉️ Xabar: ${text}`,
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '✅ Javob qaytarish',
                        callback_data: `reply_${chatId}`,
                    },
                    {
                        text: '❌ Rad etish',
                        callback_data: `ignore_${chatId}`,
                    }
                ],
            ],
        },
    };

    bot.sendMessage(adminMessage.chat_id, adminMessage.text, {
        reply_markup: adminMessage.reply_markup
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const action = query.data;

    if (action === 'send_message') {
        bot.sendMessage(chatId, 'Iltimos, anonim xabaringizni yozib qoldiring:');
    } else if (action === 'admin_info') {
        bot.sendMessage(chatId, `👤 Admin haqida ma'lumot:\n\nIsm: Sherzod\nFamilya: Omilxonov\nYashash hududi: Jizzax Viloyati, Shahri\nYoshi: 16\nKasbi: Frontend Dasturchi \n Personal Blog: @sherzodbeks_blogs\n Work&Hobby @frontend_quizz `);
    } else if (action === 'contact') {
        bot.sendMessage(chatId, 'Men bilan bog\'lanish:\n\n📞 Telefon: +998910281101\n📧 Email: omilxanovs7@gmail.com \n Telegram: @omilxanov \n Yoki anonim Habar qoldiring😉!');
    } else {
        const actionParts = action.split('_');
        const messageAction = actionParts[0];
        const userId = actionParts[1];

        const messageId = query.message.message_id;

        if (chatId != ADMIN_ID) {
            return bot.sendMessage(chatId, `Siz faqat administratorga murojaat qilishingiz mumkin.`);
        }

        bot.editMessageReplyMarkup({
            inline_keyboard: [[{
                text: messageAction === 'reply' ? '✅ Javob qaytarilmoqda...' : '❌ Rad etildi',
                callback_data: 'processed'
            }]]
        }, {
            chat_id: chatId,
            message_id: messageId
        });

        if (messageAction === 'reply') {
            // Admin wants to reply
            bot.sendMessage(chatId, 'Iltimos, javobni yozing:');

            // Set up a one-time listener for the admin's reply
            bot.once('message', (msg) => {
                if (msg.chat.id != ADMIN_ID) return;
                const response = msg.text;

                // Send admin's reply to the user
                bot.sendMessage(userId, `Sizga administrator javobi:\n\n${response}`);

                // Confirm to admin that reply was sent
                bot.sendMessage(chatId, `✅ Javob yuborildi!`);

                // Update the original message to show it was replied to
                bot.editMessageReplyMarkup({
                    inline_keyboard: [[{
                        text: '✅ Javob yuborildi',
                        callback_data: 'processed'
                    }]]
                }, {
                    chat_id: chatId,
                    message_id: messageId
                });
            });
        } else {
            // Admin chose to ignore the message
            bot.sendMessage(chatId, `❌ Xabar rad etildi.`);
        }
    }
});

bot.onText(/\/reply_(\d+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    // Only admin can use this command
    if (chatId != ADMIN_ID) return;

    const userId = match[1];
    const replyText = match[2];

    // Send reply to user
    bot.sendMessage(userId, `Sizga administrator javobi:\n\n${replyText}`);

    // Confirm to admin
    bot.sendMessage(chatId, `✅ Javob yuborildi ID: ${userId}`);
});
