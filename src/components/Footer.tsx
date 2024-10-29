import { GeistSans } from "geist/font/sans";
import { BiSolidMessageEdit } from "react-icons/bi";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
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
import { useRouter } from "next/router";
import Link from "next/link";


export const Footer = () => {

    const [formOpen, setFormOpen] = useState(false)

    const router = useRouter()

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
            setFormOpen(false)
            form.reset()
        }        
    }

    return (    
        <footer className={`w-full h-[80px] pt-8 pb-8 px-3 ${GeistSans.className}`}>
            <div className="h-full w-full flex flex-col justify-center items-center">
                {
                    router.route.includes("contact") ? null :
                    <Dialog open={formOpen}>
                        <DialogTrigger asChild onClick={() => setFormOpen(true)}>
                            <div className="flex items-center cursor-pointer">             
                                <BiSolidMessageEdit className="pt-1 text-2xl" />
                                <p className="ml-1">
                                    contact
                                </p>
                            </div>
                        </DialogTrigger>
                        <DialogContent closeFormOverride={() => setFormOpen(false)} className={`${GeistSans.className} sm:max-w-[425px] rounded-sm`}>   
                            <ScrollArea className="h-[50vh] w-full my-6">
                                    
                                <DialogHeader>
                                    <DialogTitle className="text-center">Get in touch!</DialogTitle>
                                    <DialogDescription className="text-center">
                                        Fill out the form below to reach out to us. We usually respond in one business day.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 mx-8 py-4">
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
                                                        <Input placeholder="Please enter your name." {...field} />
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
                                                        <Input placeholder="Please enter your email." {...field} type="email" />
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
                                                        <Select {...field}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a provided service" />
                                                            </SelectTrigger>
                                                            <SelectContent className={GeistSans.className}>
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
                                                        <Textarea placeholder="Please enter a message." {...field} />
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
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}                         
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter className="mt-4">
                                            <div className="flex flex-col w-full items-center">
                                                
                                                <Button type="submit">submit</Button>
                                                <Link onClick={() => setFormOpen(false)} href="/privacy" className="text-xs mt-2 text-muted-foreground">privacy</Link>
                                                <Link onClick={() => setFormOpen(false)} href="/terms_of_service" className="text-xs mb-2 text-muted-foreground">terms of service</Link>
                                            </div>
                                        </DialogFooter>
                                    </form>
                                </Form>
                                
                            </ScrollArea>
                        </DialogContent>

                    </Dialog>
                }
                <p className="text-xs my-2 text-muted-foreground">&#169; ada lundhe 2024</p>
            </div>
        </footer>
    )
}