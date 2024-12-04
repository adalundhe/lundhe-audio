import { Layout } from "~/components/Layout"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "~/components/ui/card"
import Image from "next/image";
import { Separator } from "~/components/ui/separator"
import { AspectRatio } from "~/components/ui/aspect-ratio"
import { StudioContentSection } from "~/components/StudioContentSection";
import {
    Accordion,
} from "~/components/ui/accordion"

const blurDataUrl = "data:image/jpeg;base64,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AAAAAAAAAAAAAAFQBRAFEAUQAAAAAABRFBRFBVZUGhAGlZUFVlQVWVBVZUFVlQUQBoQBRAFVkBoQBdEAUZAUQBRAFRAFQQFEQFQQFQQARAVEQBFQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABRFBRFBVZUFVlQVWVBVZUFVlQVWQGhAFVlQUQBRAFE0BRDQUQBRAFEQFEAVEAVBAVBAVEAEEAEAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFEAVUAVUAVWVBVZUFVkBoQBoZUFEAVWTQaGV0FNQ0F0TQFGTQa1E00F01NNBdRNNBTU1NBdNTU0F01EBUEBUEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVAFEUFEAVWVBRAGhlQU1AGjWQGtNTTQXTU00F01NNBdNTTQXTU00F01nTQXTU00F01EBdNQBUQBUEBUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFEAUQBVQBRAFEAUQBdEAUQBRAFEAUQBRAAQBRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUBBQEFAQUBBQEFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUBFAAUBBQEFARQAFAQUBEaQEFAQUBBUBBQEFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQABQRQAFARQAFAQUBBVBBQEFARGgGRpAQUBEaAZFARGkBBUBBQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAFAAUAFARRQQUAFAQUBFFBBQEFAQUBEaAZFAQUBkUBEaQERpARGkBEaQEFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFABQAUEUUEUUEUUEUABQAFBBQEFAAABQEFQBFAQUBBQGRQERpARGkBEaQGRQGRUBBUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAFBQAUAFABQAUEUABQAAAUBBQEFAQUBBQEFARFAQUBkUBEUBkUBlGkBEUBlGkBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFRQFRQFABRQAUBQAFAAUAFBFAAUBBQAAAAAAAAEFAQVAEUBEUBEaQERpARFAZRpAZRpARFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFABQUBUUBRQAUBUUBQAFAAUAAAUAAAAAFAQUBAAAAQUBEUBBUBBUBBUBEUBlGkBlGkBlGkBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQEFAQUBAAAAFRQFRQFRQUFAUAUFABQAUAFABQAABQAAAAAUBBQEFQAAEFAQAEFQEFQEFQERQGRUBGWkBlGkBkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBFAAUBFAAAGQAAAFRQFAFBQFAFVFAUAUAFBQAUAABQABQRQAAAAAAAAARQEFQBFAQAEABEUBEVARGkBlGkBlFqAiKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAoACgIoAAAwAAACgAoAKqKCqigKAKCgKigKigKACooAKAAACgAAAAAAAAgoCAAgqAIoCIoCIqAgqAiKgIioCVmtVKDNRUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVFAUAFAAAAUAAB5gAAAoAKqKAqKCqigoKAqKCgAoAKACgAKAAKAAAAAAAAAAAAAioAACAAgAIACIqAiNICMtIDNSrUoJWWqgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAoKAACgAAAAA8wAAAUAFVFBQUBUUFVFAVFBQAVUUBUUAAFAAUAAAAAFABFAQVAAAAAQABFQBFQBFQERQERUBEVASs1pmglRalBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVUUBUUBUUAABQAAB5AAAAoAKqKCqigKigqooCooKACqigKigKigAAoAAACooAAAACKgAAAAIAAioAioAioCAAiKgIioCVmtVmglSrUoIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACqigKigKigAAoAAAP//Z"


export default function Studio() {

  return (
    <>
      <Layout>
        <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
            <CardHeader className="p-0 mb-4 flex flex-col items-center px-4">
                <CardTitle className="text-2xl">Studio and Gear</CardTitle>
                <CardDescription>Quality makes all the difference.</CardDescription>
            </CardHeader>
            <div className="w-full mt-4 h-full">
                <CardContent className="p-0 w-[100%] flex flex-col items-center mb-4">       
                    <div className="flex items-center w-full px-4 h-3/4">
                        <AspectRatio ratio={4 / 3} className="flex items-center justify-center">
                            <Image
                                src="/studio/studio_front_monochrome.jpeg"
                                alt="The front of the studio for Lundhe Audio including Raven MTI2 and Console 1 control, Neve 5060 summing, ExMachina, Focal, and Neuman monitors, and numerous outboard pieces."
                                width="0"
                                height="0"
                                sizes="100vw"
                                className="w-full h-full"
                                placeholder="blur"
                                blurDataURL={blurDataUrl}
                            />
                        </AspectRatio>
                    </div>
                    <div className="px-4 my-4 text-sm">
                        <p>
                            Lundhe Audio is equipped to handle almost any need or situation, with top-tier analog equipment, state of the art software, and an ever growing
                            catalogue of instruments and tools to make musical magic happen. We're not afraid blend cutting-edge music tech with old-school sonics and 
                            techniquest to create something new. Here's some of what we use.
                        </p>
                    </div>     
                    <Accordion type="single" collapsible className="flex flex-col items-center w-full px-4">              
                        <Separator />
                        <StudioContentSection 
                            imagePath="/studio/grace_m905.jpg"
                            imageAltTxt="Photo of Lundhe Audio's monitoring."
                            title="Monitoring"
                            headerAlignment="left"
                        >
                            <p>
                                Lundhe Audio uses ExMachina Quasar MKII loudspeakers for primary monitoring, with Focal Twin 6 BE (a personal favorite)
                                and Klein and Hummel KH80DSP as secondary monitoring options.
                            </p>
                            <br/>
                            <p>
                                We exclusively use Audeze headphones - including:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>LCD5</li>
                                <li>LCD4</li>
                                <li>LCD3</li>
                                <li>LCD-XC</li>
                            </ul>
                            <p>
                                All monitoring is controlled via Grace m905, ensuring no detail goes unheard.
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/500_series_rack_02.jpg"
                            imageAltTxt="Photo of one of Lundhe Audio's Dangerous Convert AD+."
                            title="Conversion"
                            headerAlignment="right"
                        >
                            <p>
                                Conversion is paramount to quality mixing and mastering. At Lundhe Audio we use top-shelf A/D
                                and D/A, including:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Universal Audio Apollo X16 (x4)</li>
                                <li>Dangerous Convert AD+</li>
                                <li>SPL Mercury Mastering D/A</li>
                                <li>Crane Song Interstellar Mastering A/D</li>
                            </ul>
                            <p>
                                to ensure nothing gets lost in translation.
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/audeze_lcd5_and_rnd_5060.jpg"
                            imageAltTxt="Photo of the Ruper Neve Designs 5060 with Audeze LCD5s laying on top."
                            title="Console"
                            headerAlignment="left"
                        >
                            <p>
                                Nothing sounds better than pushing sound through quality transformers and signal path.
                            </p>
                            <br/>
                            <p>
                                Mixes are sweetend through <i>sixty-four</i> channels of legendary Rupert Neve designs summing - including four 5059 satellites and a 5060 centerpiece -
                                with judicious application of Silk harmonics to add warmth and detail. Signal flow is managed by a suite of four Flock Patch units, ensuring
                                fast turnaround and easy recall.
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/preamps_01.jpg"
                            imageAltTxt="Photo of Lundhe Audio's Manley, Tube Tech, Avalon, and LaChapell Audio preamps."
                            title="Preamps"
                            headerAlignment="right"
                        >
                            <p>
                                Lundhe Audio provides a wealth of preamp options both for recording and re-amping existing material. We offer:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>A-Designs Pacifica</li>
                                <li>A-Designs REDDI V2 Dual Channel DI</li>
                                <li>API 512V 500 Pre (<b>x2</b>)</li>
                                <li>Avalon Designs 2022AD Dual Preamp</li>
                                <li>Avedis MA5 (<b>x2</b>)</li>
                                <li>Avedis MD7 (<b>x2</b>)</li>
                                <li>Blue Robbie Tube Mic Preamp</li>
                                <li>Chandler Limited Germanium 500 Pre (<b>x2</b>)</li>
                                <li>Chandler Limited Little Devil 500 Pre (<b>x2</b>)</li>
                                <li>Chandler Limited TG2 500 Pre (<b>x2</b>)</li>
                                <li>Focusrite Liquid Channel (<b>x2</b>)</li>
                                <li>Focusrite Red 1 Quad Pre</li>
                                <li>H2 Audio Helios 2128 500 Pre (<b>x2</b>)</li>
                                <li>Kerwax Replica</li>
                                <li>LaChapell Audio 992EG</li>
                                <li>Manley Core Channel Strip</li>
                                <li>Overstayer Modular Channel 8755DM (with transformers and mic preamps)</li>
                                <li>Retro Instruments 500 Pre (<b>x2</b>)</li>
                                <li>Rupert Neve Designs 5025 Dual Shelford Pre</li>
                                <li>Shadow Hills Mono GAMMA 500 Pre (<b>x2</b>)</li>
                                <li>Soyuz Launcher Deluxe</li>
                                <li>Summit Audio MPC-100A Channel Strip (<b>x2</b>)</li>
                                <li>Thermionic Culture Vulture Super 15 Mastering Edition</li>
                                <li>Tierra Audio Lava Analog Edition Preamp (<b>x2</b>)</li>
                                <li>Tube-Tech MP2A</li>
                                <li>Universal Audio 4110 Quad Pre</li>
                                <li>Wes Audio Phoebe 500 Pre (<b>x2</b>)</li>
                            </ul>
                            <p>
                                as well as numerous old-school options like Akai S950 samplers and more.
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/spl_iron_v2.jpg"
                            imageAltTxt="Photo of Lundhe Audio's SPL Iron V2 mastering compressor."
                            title="Dynamics and Compression"
                            headerAlignment="left"
                        >
                            <p>
                                We love compressors at Lundhe Audio - not just for shaping sounds or enhancing groove, but as creative
                                tools for sound design, fun, and profit. We're picky though, and it's reflected in our choice
                                of tools:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>API 2500+ Bus Compressor</li>
                                <li>Bettermaker Mastering Limiter</li>
                                <li>Buzz Audio SOC-20 Optical Compressor</li>
                                <li>Chanlder Limited Germanium Compressor (<b>x2</b>)</li>
                                <li>Chanlder Limited Little Devil 500 (<b>x2</b>)</li>
                                <li>Chandler Limited Zener Limiter</li>
                                <li>DBX 160SL</li>
                                <li>Dramastic Audio Obsidian 500</li>
                                <li>Elysia Alpha</li>
                                <li>Elysia Karacter 500</li>
                                <li>Elysia mPressor 500 (<b>x2</b>)</li>
                                <li>Elysia nVelope 500</li>
                                <li>HUM Audio LAAL (Look Ahead Analog Limiter)</li>
                                <li>Manley VariMu TheWorks (t-bar mod and mid/side)</li>
                                <li>Purple Audio MC77 (<b>x2</b>)</li>
                                <li>Retro Instruments Revolver</li>
                                <li>Rupert Neve Designs Master Bus Processor</li>
                                <li>Rupert Neve Designs 535 Diode Bridge Compressor (<b>x2</b>)</li>
                                <li>Rupert Neve Designs 543 VCA Compressor (<b>x2</b>)</li>
                                <li>Serpent Audio Chimera Optical Compressor (<b>x2</b>)</li>
                                <li>Serpent Audio Splice-500 FET Compressor (<b>x2</b>)</li>
                                <li>Shadow Hills Dual Vandergraph</li>
                                <li>Slate Audio Dragon (<b>x2</b>)</li>
                                <li>SPL Iron V2 Mastering Compressor</li>
                                <li>Standard Audio Level-OR 500 Compressor (<b>x2</b>)</li>
                                <li>Summit Audio DCL-200</li>
                                <li>Tegeler Audio Creme RC</li>
                                <li>Tierra Audio Boreal FET Compressor (<b>x2</b>)</li>
                                <li>WesAudio Dione VCA Compressor</li>
                                <li>WesAudio MIMAS FET Compressor (<b>x2</b>)</li>
                                <li>WesAudio RHEA VariMu compressor</li>
                            </ul>
                            <p>
                                Several of our channel strips also come with dynamics processing options. 
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/spl_passeq.jpg"
                            imageAltTxt="Photo of Lundhe Audio's SPL PassEQ mastering equalizer."
                            title="Equalizers"
                            headerAlignment="right"
                        >
                            <p>
                                EQing is for more than fixing tracks! It's a means of enhancing a performance, bringing
                                out or shaping details and fundamentally controlling the energy of the music. We employ:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>API 550B 500 Equalizer (<b>x2</b>)</li>
                                <li>Avedis E27 (<b>x6</b>)</li>
                                <li>Chandler Limited Curve Bender Mastering Equalizer</li>
                                <li>Chandler Limited Little Devil Equalizer (<b>x2</b>)</li>
                                <li>Craneborne Audio Carnby Harmonic Equalizer (<b>x2</b>)</li>
                                <li>H2 Audio Helios 5011 Equalizer (<b>x4</b>)</li>
                                <li>Knif Audio Eksa w/ Gain and Filter Option</li>
                                <li>Kush Audio Clariphonic Mid/Side</li>
                                <li>Manley Massive Passive</li>
                                <li>Pultec EQP-500X (<b>x2</b>)</li>
                                <li>Pultec MEQ-500 Jack Douglas Edition (<b>x2</b>)</li>
                                <li>Rupert Neve Designs 551 Inductor Equalizer (<b>x2</b>)</li>
                                <li>SPL PQ Mastering Equalizer</li>
                                <li>SPL PassEQ Mastering Equalizer</li>
                                <li>Tierra Audio Icicle Equalizer (<b>x2</b>)</li>
                                <li>WesAudio Hyperion</li>
                                <li>WesAudio Prometheus Passive Equalizer</li>
                            </ul>
                            <p>
                                Several of our channel strips also come with equalization options. 
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/echofix_efx3.jpg"
                            imageAltTxt="Photo of Lundhe Audio's EchoFix EF-X3 tape delay front panel."
                            title="Effects"
                            headerAlignment="left"
                        >
                            <p>
                                Reverb, delay, and other effects bring space and depth to music that simply would not
                                be possible otherwise. We use:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Bricast M7</li>
                                <li>EchoFix EF-X3</li>
                                <li>Ensoniq DP/4 Multi-Effects</li>
                                <li>Eventide H9000</li>
                                <li>T-Rex Binson Echorec</li>
                            </ul>
                            <p>
                                We also offer a vertiable treasure trove of effects pedals to shape your sound, including almost the
                                entire Chase Bliss Audio lineup (past and present), Meris, Game Changer Audio, and more.
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/500_series_rack_01.jpg"
                            imageAltTxt="Photo of one of Lundhe Audio's 500 Series processing racks, containing a multitude of analog equipment."
                            title="Other"
                            headerAlignment="right"
                        >
                            <p>
                                Our studio also contains some unique equipment, including:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Black Box HG-2</li>
                                <li>Empirical Labs EL7 Fatso</li>
                                <li>Rupert Neve Designs Master Bus Transformer</li>
                                <li>Sherman Filterbank Desktop (<b>x2</b>)</li>
                                <li>SPL BIG 500 Stereo Imaging</li>
                                <li>SPL Gemini Mid/Side Mastering Router</li>
                                <li>SPL Hermes Mastering Router</li>
                                <li>Whitestone P331A Tube-Loading Amplifier</li>
                            </ul>
                            <p>
                                to further productions.
                            </p>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/soyuz_017_fet.jpg"
                            imageAltTxt="Photo of Lundhe Audio's Soyuz 017 FET Mic."
                            title="LDC Microphones"
                            headerAlignment="left"
                        >
                            <p>
                                We offer a carefully curated selection of excellent large diaphragm condenser 
                                microphones:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Austrian Audio OC818 (<b>x2</b>)</li>
                                <li>Blue Blueberry FET Condenser Mic (Latvian version)</li>
                                <li>Blue Bottle w/ All Capsules (Latvian version - <b>x2</b>)</li>
                                <li>Blue Cactus Tube Condenser Mic (Latvian version)</li>
                                <li>Blue Dragonfly Condenser Mic (Latvian version - <b>x2</b>)</li>
                                <li>Blue Kiwi FET Condenser Mic (Latvian version)</li>
                                <li>Blue Mouse FET Condenser Mic (Latvian version)</li>
                                <li>Chandler Limtied TG Microphone</li>
                                <li>Chandler Limtied REDD Microphone</li>
                                <li>Hendyamps LDC Microphone</li>
                                <li>Heiserman H47 FET</li>
                                <li>Lauten Audio Atlantis</li>
                                <li>Lauten Audio Eden</li>
                                <li>Lewitt LCT 1040 FET/Tube Microphone</li>
                                <li>Mojave Audio MA-37</li>
                                <li>Mojave Audio MA-1000</li>
                                <li>Ohma Motif Condenser Microphone</li>
                                <li>Neumann M149</li>
                                <li>Rupert Neve/sE RNT Tube LDC Microphone</li>
                                <li>Sonotronics Mercury</li>
                                <li>Soyuz 017 FET</li>
                                <li>Soyuz 017 TUBE</li>
                                <li>Soyuz 023 Bomblet</li>
                                <li>Soyuz 1973 Transformerless LDC Microphone</li>
                                <li>Violet Designs Amethyst - Vintage</li>
                            </ul>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/soyuz_013_tube.jpg"
                            imageAltTxt="Photo of Lundhe Audio's matched pair of Soyuz 013 TUBE microphones."
                            title="SDC Microphones"
                            headerAlignment="right"
                        >
                            <p>
                                For instrument and field recordings, we also offer a like curated selection of small
                                diaphragm condenser microphones:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Austrian Audio CC8 (<b>matched pair</b>)</li>
                                <li>Blue Hummingbird (<b>x2</b>)</li>
                                <li>Earthworks QTC50 (<b>x2</b>)</li>
                                <li>Josephson C42 (<b>matched pair</b>)</li>
                                <li>Rode NTG-3B</li>
                                <li>Samar MG20 (<b>x2</b>)</li>
                                <li>Schoeps CMIT5U</li>
                                <li>Schoeps CMC6 with MK4 Cardioid Capsules (<b>matched pair</b>)</li>
                                <li>Schoeps V4 USM Set - Blue</li>
                                <li>sE Electronics RN17 (<b>matched pair</b>)</li>
                                <li>Soyuz 013 FET (<b>matched pair</b>)</li>
                                <li>Soyuz 013 TUBE (<b>matched pair</b>)</li>
                                <li>Telefunken ELA M 260</li>
                            </ul>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/royer_r10.jpg"
                            imageAltTxt="Photo of Lundhe Audio's pair of Royer R10 Hot Rod microphones."
                            title="Ribbon Microphones"
                            headerAlignment="left"
                        >
                            <p>
                                For guitar and instrument recordings, we offer the following ribbon microphones:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Blue Woodpecker</li>
                                <li>Hum Audio ARM-1L</li>
                                <li>Ohma Motif Ribbon Microphone (<b>x2</b>)</li>
                                <li>Samar VL37A (<b>x2</b>)</li>
                                <li>sE Electronics RNR1 Active Ribbon Microphone</li>
                                <li>Sontronics Sigma 2 Active Ribbon Microphone</li>
                                <li>Royer 121 (<b>x2</b>)</li>
                                <li>Royer R10 Hot Rod (<b>x2</b>)</li>
                                <li>Tierra Audio New Twenties Ribbon</li>
                            </ul>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/shure_sm7b.jpeg"
                            imageAltTxt="Photo of Lundhe Audio's Shure SM7b microphone."
                            title="Dynamic Microphones"
                            headerAlignment="right"
                        >
                            <p>
                                No studio is complete without a healthy collection of dynamic microphones
                                to record demainding sources. We use:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Beyerdynamic M88</li>
                                <li>Sennheiser MD421 MKII (<b>x2</b>)</li>
                                <li>Shure SM57 (<b>x4</b>)</li>
                                <li>Shure Beta 57A</li>
                                <li>Shure Beta 58A</li>
                                <li>Shure SM7B</li>
                            </ul>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/udo_super_gemini-monochrome.jpg"
                            imageAltTxt="Photo of Lundhe Audio's UDO Super Gemini."
                            title="Synthesizers and Samplers"
                            headerAlignment="left"
                        >
                            <p>
                                Lundhe Audio brings the best of modern and vintage synthesis. From the rich sounds of classics 
                                like the Juno 6 to the cutting tones of modern giants like the Waldorf Quantum, we offer a wealth 
                                of synthesis options:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Access Virus TI</li>
                                <li>Akai AX-60</li>
                                <li>Akai AX-80</li>
                                <li>Akai S5000</li>
                                <li>Akai S6000</li>
                                <li>Akai S950 (<b>x2</b>)</li>
                                <li>Alesis Andromeda A6</li>
                                <li>Alesis Ion</li>
                                <li>Analogue Solutions Fusebox X</li>
                                <li>Analogue Solutions Impulse Command</li>
                                <li>Analogue Solutions Lezpig V3</li>
                                <li>Analogue Solutions Vostok V2</li>
                                <li>Arturia Drumbrute Impact</li>
                                <li>Arturia Matrixbrute</li>
                                <li>Arturia MicroFreak</li>
                                <li>Arturia MiniFreak</li>
                                <li>Arturia Origin</li>
                                <li>Arturia Polybrute 12</li>
                                <li>Black Corporation Deckard's Dream MKII</li>
                                <li>Black Corportation ISE-NIN</li>
                                <li>Black Corporation Kijimi MKII</li>
                                <li>Black Corporation Xerxes MKII</li>
                                <li>Crumar Seven</li>
                                <li>Dave Smith Instruments Mopho X4</li>
                                <li>Dave Smith Instruments OB-6</li>
                                <li>Dave Smith Instruments Poly Evolver - PE Edition</li>
                                <li>Dave Smith Instruments Pro-2</li>
                                <li>Dave Smith Instruments Prophet 6</li>
                                <li>Dave Smith Instruments Prophet 12</li>
                                <li>Dave Smith Instruments Prophet Rev 2 - 16 voice</li>
                                <li>Dave Smiwth Instruments Prophet XL</li>
                                <li>Dinsync RE-303</li>
                                <li>Dreadbox Erebus V3</li>
                                <li>Dreadbox Murmux Adept</li>
                                <li>Dreadbox Nymphes</li>
                                <li>Dreadbox Typhon</li>
                                <li>E-MU E4X4 Ultra</li>
                                <li>E-MU Orbit 9090</li>
                                <li>E-MU Proteus 2500 (fully expanded)</li>
                                <li>Elektron Analog Four MKI</li>
                                <li>Elektron Analog Four MKII</li>
                                <li>Elektron Analog Rytm MKII</li>
                                <li>Elektron Digitakt MKI</li>
                                <li>Elektron Digitone MKII</li>
                                <li>Elektron Octotrack MKII</li>
                                <li>Elta Music Solar 42f</li>
                                <li>Elta Music Solar 50</li>
                                <li>Ensoniq ASR10</li>
                                <li>Ensoniq SQ-80</li>
                                <li>Erica Synths Bassline DB-01</li>
                                <li>Erica Synths LXR-02</li>
                                <li>Erica Synths Perkons HD-01</li>
                                <li>Erica Synths Syntrx MKI</li>
                                <li>Future Retro Vecrta</li>
                                <li>GS Music e7 (<b>x2</b>)</li>
                                <li>Groove Synthesis 3rd Wave</li>
                                <li>GRP A4</li>
                                <li>Hypersynth Xenophone</li>
                                <li>IK Multimedia Uno Synth Pro</li>
                                <li>Intellijel Cascadia</li>
                                <li>Isla Instruments SP2400</li>
                                <li>Jomox Alpha Base MKI</li>
                                <li>Kawai SX-210</li>
                                <li>Kawai SX-240</li>
                                <li>Kilpatrick Phenol</li>
                                <li>Korg ARP-2600FS</li>
                                <li>Korg ARP Odyssey Rev1 (reissue)</li>
                                <li>Korg Drumalogue</li>
                                <li>Korg DSS-1</li>
                                <li>Korg DW-8000</li>
                                <li>Korg Minikorg 700FS</li>
                                <li>Korg Minilogue</li>
                                <li>Korg Modwave</li>
                                <li>Korg MS-20FS (reissue)</li>
                                <li>Korg Opsix</li>
                                <li>Korg Poly-800 MKII</li>
                                <li>Korg Polysix</li>
                                <li>Korg Prologue 16</li>
                                <li>Korg Radias</li>
                                <li>Korg Wavestate</li>
                                <li>Majella Implexus</li>
                                <li>Make Noise 0-Coast</li>
                                <li>Make Noise Striga</li>
                                <li>Malekko Manther</li>
                                <li>Melbourne Instruments Delia</li>
                                <li>Melbourne Instruments Nina</li>
                                <li>Modal 002</li>
                                <li>Modal 008</li>
                                <li>Modal Argon 8</li>
                                <li>Modal Cobalt 8</li>
                                <li>Modor DR-2</li>
                                <li>Modor NF-1</li>
                                <li>Moog DFAM (<b>x2</b>)</li>
                                <li>Moog Labrynth</li>
                                <li>Moog Mother-32</li>
                                <li>Moog Grandmother</li>
                                <li>Moog Matriarch</li>
                                <li>Moog Model D (2023 reissue)</li>
                                <li>Moog Little Phatty Stage One MKII - (Limited Editition Toxic Version)</li>
                                <li>Moog Mavis</li>
                                <li>Moog Muse</li>
                                <li>Moog One - 16 Voice</li>
                                <li>Moog Subharmonicon</li>
                                <li>Moog Subsequent 37 - CV</li>
                                <li>Moog Voyager</li>
                                <li>Motas Electronics Motas 6</li>
                                <li>Mutable Instruments Ambika</li>
                                <li>Nonlinear Labs C15</li>
                                <li>Norand Mono MKII</li>
                                <li>Novation Bass Station MKII</li>
                                <li>Novation Summit</li>
                                <li>Oberheim DX</li>
                                <li>Oberheim OB-X8</li>
                                <li>Pittsburgh Modular Lifeforms SV-1</li>
                                <li>Pittsburgh Modular Microvolt 3900</li>
                                <li>Pittsburgh Modular Taiga</li>
                                <li>Pittsburgh Modular Taiga Keys</li>
                                <li>Pittsburgh Modular Voltage Lab</li>
                                <li>Pittsburgh Modular Voltage Lab 2</li>
                                <li>Pioneer Toriaz AS-1</li>
                                <li>Pioneer Toriaz SP-16</li>
                                <li>Polyend Medusa</li>
                                <li>Polyend Play</li>
                                <li>Polyend Tracker</li>
                                <li>PWM Malevolent</li>
                                <li>PWM Mantis</li>
                                <li>Quasimidi Raveolutio-309 (fully expanded)</li>
                                <li>Radikal Technologies Spectralis MKI</li>
                                <li>Roland JD-XA</li>
                                <li>Roland Jupiter 6 (with Europa Mod)</li>
                                <li>Roland Juno 6</li>
                                <li>Roland JX-3P (with Kiwi Mod and Retroaktiv Programmer)</li>
                                <li>Roland JX-10</li>
                                <li>Roland SH-101</li>
                                <li>Roland System-8</li>
                                <li>Roland TR-8S</li>
                                <li>Roland V-Synth XT</li>
                                <li>Sequential Pro-3 SE</li>
                                <li>Sequential Prophet 10 (reissue)</li>
                                <li>Sequential Trigon 6</li>
                                <li>Soma Lyra 8</li>
                                <li>Soma Pulsar 23</li>
                                <li>Supercritical Redshift 6</li>
                                <li>Tasty Chips GR-1 Granular Synth</li>
                                <li>UDO Super Gemini</li>
                                <li>Vermona DRM1 - MK4</li>
                                <li>Vermona PerFourMer MKII</li>
                                <li>Waldorf Blofeld</li>
                                <li>Waldorf Kyra</li>
                                <li>Waldorf M</li>
                                <li>Waldorf Pulse 2</li>
                                <li>Waldorf Quantum - MKI</li>
                            </ul>
                        </StudioContentSection>
                        <StudioContentSection 
                            imagePath="/studio/gretsch_duo_jet-monochrome.jpg"
                            imageAltTxt="Photo of Lundhe Audio's Suhr Standard Plus Koa."
                            title="Guitars"
                            headerAlignment="right"
                        >
                            <p>
                                We offer the following guitars and basses:
                            </p>
                            <ul className="my-4 list-disc list-inside">
                                <li>Collings 290 (with Lollard Gold pickups)</li>
                                <li>Ernie Ball Singray Special 5HH</li>
                                <li>Gretsch G6128 Duo Jet Masterbuilt</li>
                                <li>Gretsch GT6995TG Broadkaster Jr.</li>
                                <li>Mayones Viking 5</li>
                                <li>Mood Guitars Moodbender</li>
                                <li>Oopegg Trailblazer Custom MKII</li>
                                <li>Suhr Classic P-Bass</li>
                                <li>Suhr Pete Thorn Standard HSS</li>
                                <li>Suhr Standard Plus Koa</li>
                            </ul>
                        </StudioContentSection>
                    </Accordion>        
                </CardContent>
            </div>
        </Card>
      </Layout>
    </>
  );
}
