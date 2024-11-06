import { z } from "zod";
import { ServerClient } from 'postmark'
import { Twilio } from 'twilio'
import ky, { HTTPError } from 'ky';
import { env } from "~/env";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";


interface ContactResponse {
    errorCode?: number
    captchaError?: string,
    emailError?: string,
    smsError?: string,
    emailContext?: string,
    smsContext?: string
}


const submitCaptchaVerification = async ({
    captchaToken
}: {
    captchaToken: string
}) => {
    
    const captchaSecretKey = env.GOOGLE_RECAPTCHA_SECRET_KEY

    try {
        const captchaResponse = await ky.post<{
            success: boolean,
            challenge_ts: Date,
            hostname: string,
            "error-codes": Array<string>
        }>(`https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecretKey}&response=${captchaToken}`)
        
        const captchaResponseData = await captchaResponse.json()

        if (!captchaResponseData.success){
            return {
                errorCode: captchaResponse.status,
                captchaError: "Captcha failed.",
            } as ContactResponse
        }

    } catch (error) {

        return {
            errorCode: 500,
            captchaError: (error as HTTPError).message,
        } as ContactResponse
        
    }
}

const sendEmail = async ({
    toEmail,
    templateId,
    client,
}: {
    toEmail: string,
    templateId: number,
    client: ServerClient
}) => {

        const emailResponse = await client.sendEmailWithTemplate({
            From: env.LUNDHE_AUDIO_EMAIL,
            To: toEmail,
            TemplateId: templateId, // Contact received template ID
            TemplateModel: {},
            InlineCss: true,
            TrackOpens: true,
        })

        return (
            emailResponse.ErrorCode > 0 ? {
                errorCode: emailResponse.ErrorCode,
                emailError: emailResponse.Message,
            } : {
                emailContext: emailResponse.Message,
            }
        ) as ContactResponse
}


const sendSMSMessage = async ({
    toPhone,
    message,
    client,
}: {
    toPhone: string,
    message: string,
    client: Twilio,
}) => {
    const phoneNumber = toPhone.startsWith('+') ? toPhone : `+1${toPhone}`
    const response = await client.messages.create({
        to: phoneNumber.replace(/\(|\)|\s+|-/g, ""),
        from: env.TWILIO_PHONE_NUMBER,
        body: message,
    }) 
    
    return {
        errorCode: response.errorCode,
        smsError: response.errorMessage,
        smsContext: response.body,
    } as ContactResponse
    
}

export const contactRouter = createTRPCRouter({
  submitContactForm: publicProcedure
    .input(z.object({ 
        name: z.string().min(2, {
            message: "Name cannot be shorter than 2 characters."
        }).max(50, {
            message: "Name cannot be longer than 50 characters."
        }),
        email: z.string().email({
            message: "Not a valid email."
        }),
        phone: z.string().refine((value) => /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/.test(value), {
            message: "Invalid phone number."
        }),
        service: z.enum(["mixing", "mastering", "sound-design", "commercial-audio", "other"]),
        message: z.string().min(5, {
            message: "Message cannot be less than 5 characters."
        }).max(280, {
            message: "Message cannot be more than 280 characters."
        }),
        contactConsent: z.boolean(),
        captchaToken: z.string().min(1, {
            message: "Captcha token cannot be empty string."
        }),
     }))
    .mutation(async ({ input, ctx }) => {

        const captchaResponse = await submitCaptchaVerification({
            captchaToken: input.captchaToken
        })

        if (captchaResponse !== undefined){
            return captchaResponse
        }

        const emailResponse = await sendEmail({
            toEmail: input.email,
            templateId: 37905639, // Contact received template ID,
            client: ctx.postmark,
        })

        if (emailResponse.errorCode){
            return emailResponse
        }

        if (input.contactConsent){
            const textResponse = await sendSMSMessage({
                toPhone: input.phone,
                message: "Thanks for contacting Lundhe Audio! We've received your request! We usually respond within about one business day.",
                client: ctx.twilio,
            })

            return Object.assign(emailResponse, textResponse);

        }

        return emailResponse;

    }),

});
