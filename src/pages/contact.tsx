import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "~/components/ui/card"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Button } from "~/components/ui/button"
import { z } from "zod"
import { ScrollArea } from "~/components/ui/scroll-area"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { api } from '~/utils/api';
import { useReCaptcha } from '~/hooks/use-recaptcha'



export default function Contact(){
    
    const { reCaptchaLoaded, generateReCaptchaToken } = useReCaptcha();
    const formMutation = api.contact.submitContactForm.useMutation();

    const [formState, setFormState] = useState<{
        formStatus: "active" | "submitted" | "errored"
        formError?: string
    }>({
        formStatus: "active"
    })

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
            contactConsent: false,
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

            formMutation.mutate({
                ...values,
                captchaToken,
            }, {
                onSuccess: ({ 
                    errorCode,
                    captchaError,
                    emailError,
                    smsError,
                 }) => {

                    const error = captchaError ?? emailError ?? smsError;
                    if (errorCode === undefined && error === undefined){
                        form.reset()
                        setFormState({
                            formStatus: "submitted",
                        })
                        return
                    }

                    setFormState({
                        formStatus: "errored",
                        formError: error
                    })

                },
                onError: () => {
                    setFormState({
                        formStatus: "errored",
                        formError: "Encountered an unknown error while submitting the form."
                    })
                }
            })

            
            setFormState({
                formStatus: "submitted",
            })
            form.reset()

        }        
    }


  return (
    <>
      <Layout>
        <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
            <CardHeader className="p-0 mb-4 flex flex-col items-center">
                <CardTitle className="w-3/4 text-2xl text-center">Get in touch!</CardTitle>
                <CardDescription className="text-center w-3/4">
                    Fill out the form below to reach out to us. We usually respond in one business day.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 w-[100%] flex flex-col items-center">
                <Form {...form}>
                    <form aria-disabled={formState.formStatus === "submitted"} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 mx-8 py-4 h-full w-full">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Name</FormLabel>
                                    <FormDescription>
                                        Your first or full name.
                                    </FormDescription>
                                    <FormControl>
                                        <Input 
                                            disabled={formState.formStatus === "submitted"}
                                            aria-disabled={formState.formStatus === "submitted"}
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
                                <FormItem className="flex flex-col">
                                    <FormLabel>Email</FormLabel>
                                    <FormDescription>
                                        Your email for us to contact you at.
                                    </FormDescription>
                                    <FormControl>
                                        <Input 
                                            disabled={formState.formStatus === "submitted"}
                                            aria-disabled={formState.formStatus === "submitted"}
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
                                <FormItem className="flex flex-col">
                                    <FormLabel>Phone</FormLabel>
                                    <FormDescription>
                                        Your phone for us to contact you at.
                                    </FormDescription>
                                    <FormControl>
                                        <Input 
                                            disabled={formState.formStatus === "submitted"} 
                                            aria-disabled={formState.formStatus === "submitted"}
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
                                <FormItem className="flex flex-col">
                                    <FormLabel>Service</FormLabel>
                                    <FormDescription>
                                        Select the service you intend to enquire about.
                                    </FormDescription>
                                    <FormControl>
                                        <Select 
                                            disabled={formState.formStatus === "submitted"} 
                                            aria-disabled={formState.formStatus === "submitted"} 
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a provided service" />
                                            </SelectTrigger>
                                            <SelectContent className={GeistSans.className} ref={field.ref}>
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
                                <FormItem className="flex flex-col">
                                    <FormLabel>Message</FormLabel>
                                    <FormDescription>
                                        Enter a message.
                                    </FormDescription>
                                    <FormControl>
                                        <Textarea
                                            disabled={formState.formStatus === "submitted"} 
                                            aria-disabled={formState.formStatus === "submitted"}
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
                                <FormItem className="grid grid-cols-12">
                                    <FormLabel  className="mt-[6.5px] text-sm w-full col-span-11 flex items-end">Opt-In SMS Terms and Conditions</FormLabel>
                                    <FormControl>
                                        <Checkbox
                                            disabled={formState.formStatus === "submitted"} 
                                            aria-disabled={formState.formStatus === "submitted"} 
                                            checked={field.value}
                                            onCheckedChange={field.onChange}                         
                                        />
                                    </FormControl>
                                    <FormDescription className="col-span-12">
                                        You consent to receive SMS messages at {field.value} provided for the express 
                                        purpose of service scheduling/confirmation and updates (carrier charges may apply).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <CardFooter className="mt-4">
                            <div className="flex flex-col w-full items-center">
                                
                                <Button   
                                    disabled={formState.formStatus === "submitted"} 
                                    aria-disabled={formState.formStatus === "submitted"}
                                    type="submit"
                                    className="w-[100px] h-36px"
                                >
                                    { formState.formStatus === "submitted" ? "submitted!" : "submit" }
                                </Button>
                                <Link onClick={() => setFormState({
                                    formStatus: "active"
                                })} href="/privacy" className="text-xs mt-2 text-muted-foreground">privacy</Link>
                                <Link onClick={() => setFormState({
                                    formStatus: "active"
                                })} href="/terms_of_service" className="text-xs mb-2 text-muted-foreground">terms of service</Link>
                                <p className={`${formState.formStatus === "errored" ? '' : 'hidden'} text-sm text-red-600`}>{formState.formError ?? "An unknown error occured while submitting the form."}</p>
                            </div>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </Layout>
    </>
  );
}
