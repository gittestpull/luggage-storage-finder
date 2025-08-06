const nodemailer = require('nodemailer');
const { sendPushNotification } = require('../utils/pushNotifications');

const sendPremiumRequestNotification = async (req, res) => {
    const { storageName, userName, userEmail } = req.body;

    if (!storageName || !userName || !userEmail) {
        return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    try {
        // 1. 이메일 알림 전송
        const transporter = nodemailer.createTransport({
            service: 'gmail', // 또는 사용하려는 이메일 서비스 (예: Naver, Outlook)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: '새로운 프리미엄 서비스 요청',
            html: `
                <p>안녕하세요, 관리자님.</p>
                <p>새로운 프리미엄 서비스 요청이 접수되었습니다.</p>
                <ul>
                    <li><strong>짐보관소 이름:</strong> ${storageName}</li>
                    <li><strong>요청자 이름:</strong> ${userName}</li>
                    <li><strong>요청자 이메일:</strong> ${userEmail}</li>
                </ul>
                <p>확인 후 필요한 조치를 취해주세요.</p>
                <p>감사합니다.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('관리자에게 이메일 알림 전송 성공');

        // 2. 푸시 알림 전송
        const notificationPayload = {
            title: '새로운 프리미엄 서비스 요청',
            body: `${storageName}에 대한 프리미엄 서비스 요청이 접수되었습니다.`, 
            icon: '/images/icon-192x192.png',
            data: { url: '/' } // 알림 클릭 시 이동할 URL
        };
        await sendPushNotification(notificationPayload);

        res.status(200).json({ message: '프리미엄 서비스 요청이 성공적으로 전송되었습니다.' });
    } catch (error) {
        console.error('프리미엄 서비스 요청 처리 중 오류 발생:', error);
        res.status(500).json({ message: '프리미엄 서비스 요청 전송에 실패했습니다.', error: error.message });
    }
};

module.exports = { sendPremiumRequestNotification };