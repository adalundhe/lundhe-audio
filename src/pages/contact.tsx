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


export default function Contact() {

    const [formActive, setFormActive] = useState(true)

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
        contactConsent: z.boolean().refine((value)=> value === true,{
            message: "You must accept the terms and conditions"
        })
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

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const errorsCount = Object.keys(form.formState.errors).length
        if(errorsCount < 1 && values.contactConsent === true){
            setFormActive(false)
            form.reset()
        }        
    }


  return (
    <>
      <Layout>
        <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none flex flex-col items-center justify-center">
            <CardHeader>
                <CardTitle className="text-center">Get in touch!</CardTitle>
                <CardDescription className="text-center">
                    Fill out the form below to reach out to us. We usually respond in one business day.
                </CardDescription>
            </CardHeader>
            <ScrollArea className="h-full w-full">
                <CardContent className="p-0 w-[100%] h-full flex flex-col items-center">
                    <Form {...form}>
                        <form aria-disabled={!formActive} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 mx-8 py-4 h-full">
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
                                                disabled={!formActive}
                                                aria-disabled={!formActive}
                                                placeholder="Please enter your name." {...field} />
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
                                                disabled={!formActive}
                                                aria-disabled={!formActive}
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
                                                disabled={!formActive} 
                                                aria-disabled={!formActive}
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
                                                disabled={!formActive} 
                                                aria-disabled={!formActive} 
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
                                                disabled={!formActive} 
                                                aria-disabled={!formActive}
                                                placeholder="Please enter a message." {...field}
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
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-sm">Accept Terms and Conditions</FormLabel>
                                        <FormDescription>
                                            You consent to receive SMS messages at {field.value} provided for the express 
                                            purpose of service scheduling/confirmation and updates (carrier charges may apply).
                                        </FormDescription>
                                        <FormControl>
                                            <Checkbox
                                                disabled={!formActive} 
                                                aria-disabled={!formActive}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}                         
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <CardFooter className="mt-4">
                                <div className="flex flex-col w-full items-center">
                                    
                                    <Button   
                                        disabled={!formActive} 
                                        aria-disabled={!formActive}
                                        type="submit"
                                        className="w-[100px] h-36px"
                                    >
                                        { formActive ? "submit" : "submitted!" }
                                    </Button>
                                    <Link onClick={() => setFormActive(false)} href="/privacy" className="text-xs mt-2 text-muted-foreground">privacy</Link>
                                    <Link onClick={() => setFormActive(false)} href="/terms_of_service" className="text-xs mb-2 text-muted-foreground">terms of service</Link>
                                </div>
                            </CardFooter>
                        </form>
                    </Form>
                </CardContent>
                
            </ScrollArea>
        </Card>
      </Layout>
    </>
  );
}
