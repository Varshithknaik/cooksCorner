import nodemailer , { Transporter } from "nodemailer";
import path from 'path';
import dotenv from 'dotenv';
import ejs from "ejs";

dotenv.config();

interface IEmailOptions{
  email: string;
  subject: string;
  template: string;
  data: { [key:string] : string }
}

const sendMail = async ( option: IEmailOptions ) => {
  const transporter:Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ,
    port: parseInt(process.env.SMTP_PORT ?? '587') ,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSSWORD
    }
  });

  const { email , subject , template , data } = option;
  
  const templatePath = path.join(__dirname , '../mails' , template);

  const html:string = await ejs.renderFile(templatePath , data);

  const mailOptions = {
    from : process.env.SMTP_MAIL,
    to: email ,
    subject,
    html
  }

  await transporter.sendMail(mailOptions)

}

export default sendMail;