import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
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
  const inviteLink = `${process.env.FRONTEND_URL}/join-group?code=${inviteCode}`;

  await transporter.sendMail({
    from: '"Music Reviews" <noreply@musicreviews.com>',
    to: email,
    subject: `Join ${groupName} on Music Reviews`,
    html: `<p>You've been invited to join the group "${groupName}"!</p>
          <a href="${inviteLink}">Accept Invitation</a>`,
  });
};
