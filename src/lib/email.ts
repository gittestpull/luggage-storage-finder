import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use host/port from env if not gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: '[짐보관소 찾기] 비밀번호 초기화 인증번호',
        text: `인증번호는 [${code}] 입니다. 5분 안에 입력해주세요.`,
        html: `<p>비밀번호 초기화를 위한 인증번호는 <strong>${code}</strong> 입니다.</p><p>5분 안에 입력해주세요.</p>`,
    };

    await transporter.sendMail(mailOptions);
}
