import { Layout } from "~/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import type { Metadata } from 'next'
import { ServicesSection } from "../_components/services-section";

export const metadata: Metadata = {
  title: 'Lündhé Audio | Services | Mastering',
  description: "Lündhé Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio studio.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    }
  ],
}


export default async function MasteringServicesPage() {
    return (
        <>
            <Layout>
                <Card className="w-full md:w-3/4 h-3/4 rounded-none border-none shadow-none flex flex-col items-center justify-center">
                    <CardHeader className="flex justify-center items-center p-0">
                        <CardTitle className="text-2xl md:text-4xl">Mastering</CardTitle>
                        <CardDescription>The final important touch.</CardDescription>
                    </CardHeader>
                    <Separator className="w-full my-4" />
                    <CardContent className="p-0 w-[100%] flex flex-col items-center mt-4">
                        <div className="w-full text-xl font-thin">
                        <p>
                            Lündhé Audio's first offering was mastering services, and we are proud that artists and creatives continue to 
                            trust us to realize that last, important mile in their musical vision's journey. As with our mixing services, we
                            blend legendary, high-end and state-of-the-art analog gear with industry-standard software and years of experience
                            to provide music with the polish and depth it deserves.
                        </p>
                        <br/>
                        <p>
                            Sessions are entirely remote, however (for an additional fee) artists may schedule virtual "in-person"
                            sessions. We do not offer on-site sessions.
                        </p>
                        </div>
                    </CardContent>

                    <Separator className="w-full my-4"/>
                    <CardContent className="p-0 w-full flex">
                        <div className="w-1/2 flex flex-col">
                            <ServicesSection
                                title="how it works"
                                group="how-it-works"
                            >
                                <div className="w-full text-xl font-thin my-4">
                                    <ul className="list-decimal list-outside pl-[revert] flex flex-col gap-4">
                                        <li>
                                        <p className="text-md mb-4">Sign Up</p>
                                        <ul className="list-disc flex flex-col gap-4">
                                            <li>
                                                The first step is to sign up! You'll create a simple account that will allow you to upload
                                                your project files, download completed masters, view our work queue, etc.
                                            </li>
                                        </ul>
                                        </li>

                                        <li className="my-4">
                                        <p className="text-md mb-4">Build</p>
                                        <ul className="list-disc flex flex-col gap-4">
                                            <li>
                                                Before scheduling a mastering slot, you will need to determine the project size. We recommend using 
                                                the Project Configurator above to calculate your session size and cost. Be sure to include any custom 
                                                options or add-ons in your quote, as we do not facilitate scope changes made to accepted projects 
                                                more than seventy-two hours (three days) prior to a scheduled slot.
                                            </li>
                                            <li>
                                                We offer options including (but not limited to) turnaround time, etc.
                                            </li>
                                            <li>
                                                You will also pay for your masters at this point. You will not be able to upload any project files or other
                                                project information until checkout has been completed.
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <p className="text-md mb-4">Upload</p>
                                        <ul className="list-disc flex flex-col gap-4">
                                            <li>
                                                You'll need to export your project, including all stems/tracks, project files, etc. In general, we 
                                                recommend uploading 24 bit, 96khz stereo WAV files, however we will accept 44.1Khz and 48Khz 24 bit
                                                stereo WAV files.

                                                <br/>
                                                
                                                We also recommend attaching links to any references using the upload notes, as well as providing any 
                                                additional context you might need.
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <p className="text-md mb-4">Queue Up</p>
                                        <ul className="list-disc flex flex-col gap-4">
                                        <li>
                                            Your work will be immediately submitted to Lündhé Audio's work queue, and we'll receive notification
                                            immediately.
                                        </li>
                                        <li>
                                            Your work will be delivered on a first-come, first-serve basis according to the turn-around time you
                                            selected. For example, if you select standard turn-around (five to seven business days), you will receive
                                            your completed project five to seven business days <b><i>after</i></b> work has started. You will receive
                                            notification when your project is scheduled, started, half-done, and completed.
                                        </li>
                                        <li>
                                            Note that you may only request modifications seventy-two hours prior to work starting. Modifications 
                                            requested less than seventy-two hours prior but more than forty-eight hours prior may be considered but will
                                            be assessed an additional 50% fee. Excessive modification requests may result in your project being cancelled 
                                            and us requesting that you re-submit at a later date.
                                        </li>
                                        <li>
                                            Your may request cancellation of your project for full refund at any point up to two weeks before work is 
                                            scheduled to start. Cancellation requests made inside of two weeks but greater than one week out from work
                                            start will be honored but only 50% of the total cost will be refunded. Cancellation requests inside of one
                                            week will be honored, however <b><i>no refund will be provided</i></b>. Excessive cancellations (more than
                                            three projects cancelled within a given three calendar months) will result in your account being terminated
                                            and us refusing to accept any further requests.
                                        </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <p className="text-md mb-4">Download</p>
                                        <ul className="list-disc flex flex-col gap-4">
                                        <li>
                                            Once your project is completed, you may download it at your leisure within 90 days. After 90 days, you may 
                                            request re-download, however we are not responsible for keeping any records, files, metadata, or other information
                                            with respect to your project.
                                        </li>
                                        <li>
                                            If you are uncertain when you might be able to retrieve your completed project,
                                            we recommend selecting the <b>extended archival</b> option when building your project.
                                        </li>
                                        <li>
                                            Final projects will be delivered as 24 bit, 44.1khz stereo WAV files.
                                        </li>
                                        </ul>
                                    </li>
                                    </ul>
                                </div>
                            </ServicesSection>
                            <ServicesSection
                            title="options"
                            group="options"
                            >
                                <div className="w-full text-xl font-thin my-4">
                                    <p>
                                    We offer a number of options to ensure your project is delivered on-time and to the highest
                                    standard possible, including:
                                    </p>
                                    <br/>
                                    <ul className="list-decimal list-outside pl-[revert] flex flex-col gap-4">
                                    <li><b>High Resolution Master ($25/track)</b> - In addition to the standard 24 bit, 44.1khz stereo WAV files, you will be provided an additional set of 24 bit, 96Khz stereo WAV files</li>
                                    <li><b>Film Master ($20/track)</b> - In addition to the standard 24 bit, 44.1Khz stereo WAV files, you will be provided an additional set of 24 bit, 48Khz stereo WAV files</li>
                                    <li><b>Spotify Master ($20/track)</b> - In addition to the standard, full-scale loudness, 24 bit/44.1Khz stereo WAV files, you will be provided an additional set of 24 bit/44.1Khz stereo WAV files mastered to Spotify's streaming specifications</li>
                                    <li><b>Tidal Master ($30/track)</b> - In addition to the standard, full-scale loudness, 24 bit/44.1Khz stereo WAV files, you will be provided an additional set of 24 bit/96Khz stereo WAV files mastered to Spotify's streaming specifications</li>
                                    <li><b>Extended Archival ($25/track)</b> - Lündhé Audio will preserve any stereo master files or stems for 365 days (one calendar year) from project completion.</li>
                                    <li>
                                        <b>Lockout ($1500/8 hour day)</b>
                                        - Lündhé Audio exclusively work on your project for the specified number of days. Note - lockout is subject to approval by Lündhé Audio and must be explicitely approved 
                                        by studio management at least two weeks prior. If lockout is requested, you forfeit the two-week free cancellation policy and agree that any cancellation request is 
                                        non-refundable. To ensure lockout does not prevent other clients from having their work completed on a reasonable schedule, the maximum number of days
                                        you may request is five (or one working week). Lockout automatically includes the following options:
                            
                                        <ul className="list-disc flex flex-col gap-4 my-4 mx-4">
                                            <li>High Resolution Master</li>
                                            <li>Film Master</li>
                                            <li>Spotify Mastering</li>
                                            <li>Tidal Mastering</li>
                                            <li>Extended Archival</li>
                                        </ul>
                                        
                                        At no extra cost.
                                    </li>
                                    <li>
                                        <b>Rush Delivery ($125/track)</b> - Lündhé Audio will guarantee project completion within twenty-four hours of submission. Your project will be prioritized on a first-come first serve basis with respect to the order in which all 
                                        other rush delivery projects were received, but will take precedence of any non-rush projects. To ensure other client projects are completed on a reasonable schedule, you may request rush delivery for no more than ten tracks and 
                                        a maximum of once per calendar month unless explicitly approved by Lündhé Audio studio management. If you select this option, you forfeit any and all rights to any refund (full or partial) or to request project option modifications.
                                    </li>
                                    <li><b>Virtual In-Person Session ($100/hour - minimum four hours)</b> - Lündhé Audio will setup a private video call for you to join where you can ask questions, provide real-time feedback, etc.</li>
                                    </ul>
                                </div>
                            </ServicesSection>
                            <ServicesSection
                                title="a la carte"
                                group="a-la-carte"
                            >
                                <div className="w-full text-xl font-thin my-4">
                                    <p>
                                        At this time Lündhé Audio only offers a-la carte mastering services for established clients who:
                                    </p>
                                    <br/>
                                    <ul className="list-decimal list-outside pl-[revert] flex flex-col gap-4">
                                        <li>Have done more than three years of business with Lündhé Audio</li>
                                        <li>Are in good standing</li>
                                        <li>Have signed an explicit, written contract from Lündhé Audio granting and guaranteeing a-la carte mastering</li>
                                    </ul>
                                </div>
                                </ServicesSection>
                                <ServicesSection
                                title="revisions"
                                group="revisions"
                                >
                                <div className="w-full text-xl font-thin my-4">
                                    <p>
                                        At Lündhé Audio we strive to get it right the first time, however we also recognize that artistic vision is sophisticated
                                        and changes. As a result, we offer a generous, scaling revision policy.
                                    </p>
                                    <br/>
                                    <ul className="list-disc list-outside pl-[revert] flex flex-col gap-4">
                                        <li><b>1-3 tracks</b> - Four revisions per track</li>
                                        <li><b>4-9 tracks</b> - Three revisions per track</li>
                                        <li><b>10-12 tracks</b> - Two revision per track</li>
                                        <li><b>12+ tracks</b> - One revision per track</li>
                                    </ul>
                                    <br/>
                                    <p>
                                        You may purchase additional revisions for your project at the cost of $125/revision.
                                    </p>
                                </div>
                            </ServicesSection>
                        </div>
                    </CardContent>
                </Card>
            </Layout>
        </>
    )
}