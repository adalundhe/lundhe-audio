"use client"
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// import { BiSolidMessageEdit } from "react-icons/bi";
import { Courier_Prime } from 'next/font/google';
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { useReCaptcha } from '~/hooks/use-recaptcha';
import { api } from '~/utils/api';

import { Mail, MailCheck, MailOpen, MailWarning, MailX, SendHorizontal, } from 'lucide-react';

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})


export const Footer = () => {

    const router = useRouter()
    const { reCaptchaLoaded, generateReCaptchaToken } = useReCaptcha();
    const formMutation = api.contact.submitContactForm.useMutation();

    const [isHovered, setIsHovered] = useState(false);

    const onMouseEnter = () => {
        setIsHovered(true);
    };
    const onMouseLeave = () => {
        setIsHovered(false);
    };

    const [formState, setFormState] = useState<{
        formStatus: "active" | "submitted" | "errored" | "closed" | "submitting",
        formError?: string
    }>({
        formStatus: "closed"
    })


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
             const key = e.key;
             
             if (key === "Escape"){
                setFormState({
                    formStatus: "closed"
                })
             }
             
        };
        document.addEventListener('keydown', handleKeyDown, true);
    
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    
    }, []);

    const formSchema = z.object({
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
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            service: "mixing",
            message: "",
            contactConsent: false
        },
    })

    const formatPhoneNumber = (value: string, previousValue: string) => {
        // return nothing if no value
        if (!value) return value; 
      
        // only allows 0-9 inputs
        const currentValue = value.replace(/[^\d]/g, '');
        const cvLength = currentValue.length; 
      
        if (!previousValue || value.length > previousValue.length) {
      
          if (cvLength < 4) return currentValue; 
      
          if (cvLength < 7) return `(${currentValue.slice(0, 3)}) ${currentValue.slice(3)}`; 
      
          return `(${currentValue.slice(0, 3)}) ${currentValue.slice(3, 6)}-${currentValue.slice(6, 10)}`; 
        }

        return value.length > 0 ? previousValue.slice(0, previousValue.length - 1) : ""
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {

        if (!reCaptchaLoaded) {
            setFormState({
                formStatus: "errored",
                formError: "Err. - Recaptcha not ready or token not provided."
            });
            return;
        }

        const captchaToken = await generateReCaptchaToken("contactFormSubmit")

        const errorsCount = Object.keys(form.formState.errors).length
        if(errorsCount < 1 && captchaToken){

            setFormState({
                formStatus: "submitting",
            })

            await formMutation.mutateAsync({
                ...values,
                submmittedAt: new Date(),
                contactConsent: values.contactConsent ? 'accepted' : 'declined',
                captchaToken,
            }, {
                onSuccess: ({ 
                    captchaError,
                    emailError,
                    smsError,
                 }) => {

                    const error = captchaError ?? emailError ?? smsError;
                    if (!error){
                        form.reset()
                        setFormState({
                            formStatus: "submitted",
                        })
                    }

                    if (formState.formStatus === "active" && error){
                        setFormState({
                            formStatus: "errored",
                            formError: error
                        })
                    }

                },
                onError: () => {
                    if (formState.formStatus === "active"){
                        setFormState({
                            formStatus: "errored",
                            formError: "Encountered an unknown error while submitting the form."
                        })
                    }
                }
            })

        }        
    }

    const path = usePathname()

    return (    
        <footer className={`w-full top-full h-[80px] pt-8 pb-8 px-3 ${courierPrime.className}`}>
            <div className="h-full w-full flex flex-col justify-center items-center text-xl font-normal">
                {
                    path?.includes("contact") ? null :
                    <Dialog open={formState.formStatus === "active" || formState.formStatus === "submitting" || formState.formStatus === "errored"}>
                        <DialogTrigger asChild onClick={() => setFormState({
                            formStatus: "active"
                        })}>
                            <div className="flex items-center cursor-pointer">             
                                <p className="ml-1">
                                    contact
                                </p>
                            </div>
                        </DialogTrigger>
                        <DialogContent closeFormOverride={() => setFormState({
                            formStatus: "closed"
                        })} className={`${courierPrime.className} sm:max-w-[800px] rounded-sm`}>   
                            <ScrollArea className="h-[50vh] w-full my-6">
                                    
                                <DialogHeader className="p-0 flex flex-col items-center">
                                    <DialogTitle className="w-3/4 text-center text-4xl">Get in touch!</DialogTitle>
                                    <DialogDescription className="w-3/4 text-center text-xl font-light">
                                        Fill out the form below to reach out to us. We usually respond in one business day.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 mx-8 py-4">
                                    <FormField     
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col my-4">
                                                <FormLabel className="text-xl font-normal">Name</FormLabel>
                                                <Separator/>
                                                <FormDescription className="text-md font-normal">
                                                    Your first or full name.
                                                </FormDescription>
                                                <FormControl>
                                                    <Input 
                                                        className="text-lg font-light"
                                                        disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"}
                                                        aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"}
                                                        placeholder="Please enter your name." {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col my-4">
                                                <FormLabel className="text-xl font-normal">Email</FormLabel>
                                                <Separator/>
                                                <FormDescription className="text-md font-normal">
                                                    Your email for us to contact you at.
                                                </FormDescription>
                                                <FormControl>
                                                    <Input 
                                                        className="text-lg font-light"
                                                        disabled={formState.formStatus === "submitted" ||formState.formStatus === "submitting"}
                                                        aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"}
                                                        placeholder="Please enter your email." 
                                                        type="email" 
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col my-4">
                                                <FormLabel className="text-xl font-normal">Phone</FormLabel>
                                                <Separator/>
                                                <FormDescription className="text-md font-normal">
                                                    Your phone for us to contact you at.
                                                </FormDescription>
                                                <FormControl>
                                                    <Input 
                                                        className="text-lg font-light"
                                                        disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                        aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"}
                                                        placeholder="Please enter your phone." {...field} 
                                                        type="phone" 
                                                        onChange={(e) => {

                                                            if (form.formState.errors.phone){
                                                                form.clearErrors("phone")
                                                            }

                                                            form.setValue("phone", formatPhoneNumber(e.target.value, field.value) ?? "")
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="service"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col my-4">
                                                <FormLabel className="text-xl font-normal">Service</FormLabel>
                                                <Separator/>
                                                <FormDescription className="text-md font-normal">
                                                    Select the service you intend to enquire about.
                                                </FormDescription>
                                                <FormControl>
                                                    <Select 
                                                        disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                        aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="text-lg font-light">
                                                            <SelectValue className="text-lg font-light" placeholder="Select a provided service" />
                                                        </SelectTrigger>
                                                        <SelectContent className={`${courierPrime.className} text-2xl font-thin`} ref={field.ref}>
                                                            <SelectItem value="mixing">mixing</SelectItem>
                                                            <SelectItem value="mastering">mastering</SelectItem>
                                                            <SelectItem value="sound-design">sound design</SelectItem>
                                                            <SelectItem value="commercial-audio">commercial audio</SelectItem>
                                                            <SelectItem value="other">other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col my-4">
                                                <FormLabel className="text-xl font-normal">Message</FormLabel>
                                                <Separator/>
                                                <FormDescription className="text-md font-noraml">
                                                    Enter a message.
                                                </FormDescription>
                                                <FormControl>
                                                    <Textarea
                                                        className="text-lg font-light"
                                                        disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                        aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"}
                                                        placeholder="Please enter a message."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contactConsent"
                                        render={({ field }) => (
                                            <FormItem className="grid grid-cols-12 my-4">
                                                <FormLabel  className="mt-[6.5px] text-xl font-normal w-full col-span-12 flex items-end">Opt-In SMS Terms and Conditions</FormLabel>
                                                <div className="col-span-12 my-2">

                                                    <Separator className="my-1"/>
                                                </div>
                                                <FormDescription className="col-span-10 text-md font-light flex self-end">
                                                    You consent to receive SMS messages at {field.value} provided for the express 
                                                    purpose of service scheduling/confirmation and updates (carrier charges may apply).
                                                </FormDescription>
                                                <FormControl>
                                                    <Checkbox
                                                        className="col-span-2 flex justify-self-center self-start rounded-full border shadow-lg h-[20px] w-[20px]"
                                                        disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                        aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}                         
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                        <DialogFooter className="mt-4">
                                        <div className="flex flex-col w-full items-center justify-center">
                                            <Button   
                                                disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"} 
                                                aria-disabled={formState.formStatus === "submitted" || formState.formStatus === "submitting"}
                                                type="submit"
                                                className="w-[150px] h-[48px] font-light flex items-end"
                                                onMouseLeave={onMouseLeave}
                                                onMouseEnter={onMouseEnter}
                                            >
                                                <div className="xl:text-[1vmax] lg:text-[1.5vmax] md:text-[2vmax] text-[2.5vmax] flex items-center">
                                                    { 
                                                        formState.formStatus === "submitting" ? "submitting..." : 
                                                        formState.formStatus === "submitted" ? "submitted!" : "submit" 
                                                    }
                                                </div>
                                                <div className="pb-[0.4em] xl:h-[1.5vmax] xl:w-[1.5vmax] lg:w-[2vmax] lg:h-[2vmax] md:w-[2.5vmax] md:h-[2.5vmax] h-[3vmax] w-[3vmax] flex items-center">
                                                    {
                                                        formState.formStatus === "active" && isHovered ? <SendHorizontal /> : 
                                                        formState.formStatus === "active" && !isHovered ? <MailOpen/> :
                                                        formState.formStatus === "submitting" ? <Mail/> :
                                                        formState.formStatus === "submitted" ? <MailCheck/> :
                                                        formState.formStatus === "errored" ? <MailX/> :
                                                        <MailWarning/>
                                                    }
                                                </div>
                                            </Button>
                                            <a onClick={() => setFormState({
                                                formStatus: "closed"
                                            })} href="/legal/privacy" className="my-2 text-lg font-light text-muted-foreground hover:underline">privacy</a>
                                            <a onClick={() => setFormState({
                                                formStatus: "closed"
                                            })} href="/legal/terms-of-service" className="text-lg font-light mb-2 text-muted-foreground hover:underline">terms of service</a>
                                            <p className={`${formState.formStatus === "errored" ? '' : 'hidden'} text-sm text-red-600`}>{formState.formError ?? "An unknown error occured while submitting the form."}</p>
                                        </div>
                                        </DialogFooter>
                                    </form>
                                </Form>
                                
                            </ScrollArea>
                        </DialogContent>

                    </Dialog>
                }
                <p className="text-sm my-2 text-muted-foreground">&#169; ada lundhe 2025</p>
              
            </div>
        </footer>
    )
}