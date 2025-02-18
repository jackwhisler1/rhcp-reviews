import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendInvitationEmail = async (
  email: string,
  groupName: string,
  inviteCode: string
) => {
  const inviteLink = `${process.env.FRONTEND_URL}/join?code=${inviteCode}`;

  await transporter.sendMail({
    from: `"Red Hot Takes" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Join ${groupName}`,
    html: `
      <p>You've been invited to join the group <strong>${groupName}</strong>!</p>
      <p>Click below to join:</p>
      <a href="${inviteLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      ">
        Join Group
      </a>
      <p>Or use this code: ${inviteCode}</p>
    `,
  });
};
