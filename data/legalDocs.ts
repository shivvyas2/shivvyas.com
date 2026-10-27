/**
 * App legal pages, served at /projects/<slug>/<doc> (privacy, terms, eula, and
 * optionally support).
 * App Store Connect links to these URLs, so keep them stable.
 */
export type LegalSection = { heading: string; body: string[] };

export type LegalDoc = {
  title: string;
  /** One line for search results and link previews. */
  summary: string;
  effective: string;
  sections: LegalSection[];
};

export type AppLegal = {
  app: string;
  /** False when the app has no /projects/<slug> page to link back to. */
  projectPage?: boolean;
  docs: Record<"privacy" | "terms" | "eula", LegalDoc> & { support?: LegalDoc };
};

const CONTACT = "shivvyas0209@gmail.com";

const cinemahud: AppLegal = {
  app: "CinemaHUD",
  docs: {
    privacy: {
      title: "Privacy Policy",
      summary:
        "CinemaHUD collects no personal data. It talks only to your camera or your own Mac on the local network, and everything it saves stays on your device.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Who we are",
          body: [
            'CinemaHUD for iPhone, iPad and Mac is developed by Shiv Vyas ("we", "us"). This policy covers every version of the app, including the App Store apps and the Mac app downloaded from this website.',
          ],
        },
        {
          heading: "What we collect",
          body: [
            "Nothing. CinemaHUD does not collect, store or transmit personal data. There are no accounts, no analytics, no advertising or tracking identifiers, no crash reporting services and no third-party SDKs that collect data. We never see how, when or where you use the app.",
          ],
        },
        {
          heading: "Local network",
          body: [
            "The app talks only to your Sony camera, over the camera's own Wi-Fi network, or to a Mac running CinemaHUD on the same local network. iOS and iPadOS ask for Local Network permission for this reason alone. The Mac app can also connect to the camera over USB. The app sends nothing to the Internet.",
          ],
        },
        {
          heading: "Photos, video and audio",
          body: [
            "Images the camera hands over during a session are saved on your device: on iPhone and iPad in the app's own folder (visible in the Files app under CinemaHUD), on the Mac in Pictures › CinemaHUD. They stay there until you delete them. The app does not read your photo library and does not upload anything.",
            "On the Mac, if you choose to record from an audio interface, the app asks for microphone access and writes the audio to files on your Mac. Audio is never transmitted.",
          ],
        },
        {
          heading: "On-device analysis",
          body: [
            "Shot Assist on the Mac measures the live picture (exposure, focus, faces and horizon) to suggest settings. Where available, Apple Intelligence phrases the suggestions using the model on your Mac. All of it happens on the device; no image or measurement leaves it.",
          ],
        },
        {
          heading: "Settings",
          body: [
            "Monitor preferences such as guides, peaking, LUTs and the last connection address are stored on your device only.",
          ],
        },
        {
          heading: "Apple",
          body: [
            "If you download CinemaHUD from the App Store, Apple may collect information under its own privacy policy, such as download and purchase records. We receive only the aggregate, anonymous statistics Apple provides to all developers.",
          ],
        },
        {
          heading: "Children",
          body: [
            "CinemaHUD is a camera tool and is not directed at children. Because it collects no data, no data about anyone is processed.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "If this policy changes, the new version will appear on this page with a new effective date.",
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about privacy: ${CONTACT}.`],
        },
      ],
    },

    terms: {
      title: "Terms of Use",
      summary: "The terms for using CinemaHUD on iPhone, iPad and Mac.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Agreement",
          body: [
            'By downloading or using CinemaHUD ("the app") you agree to these terms and to the CinemaHUD End User License Agreement. If you got the app from the App Store, Apple\'s Licensed Application End User License Agreement also applies.',
          ],
        },
        {
          heading: "The app",
          body: [
            "CinemaHUD is a remote monitor and controller for compatible Sony cameras, provided by Shiv Vyas. It is offered for personal and professional use with your own equipment.",
          ],
        },
        {
          heading: "No affiliation",
          body: [
            "CinemaHUD is an independent product. It is not affiliated with, endorsed by or sponsored by Sony Group Corporation or its subsidiaries. Sony, Alpha and α are trademarks of Sony Group Corporation and are used only to describe compatibility.",
          ],
        },
        {
          heading: "Provided as is",
          body: [
            'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. Camera behaviour, connection reliability and image quality depend on your camera, lens, firmware and network.',
          ],
        },
        {
          heading: "Your responsibility",
          body: [
            "You control the camera through the app at your own risk. You are responsible for your camera settings, your recordings, backing up your files, and for complying with the laws that apply to your filming and photography, including the privacy of people you film.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the fullest extent permitted by law, Shiv Vyas is not liable for any lost footage, missed shots, equipment damage, or indirect or consequential loss arising from use of the app.",
          ],
        },
        {
          heading: "Changes to the app or these terms",
          body: [
            "Features may change between versions as camera protocols evolve. Updated terms will appear on this page with a new effective date; continued use after an update means you accept the new terms.",
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about these terms: ${CONTACT}.`],
        },
      ],
    },

    eula: {
      title: "End User License Agreement",
      summary: "The license under which you may use CinemaHUD on iPhone, iPad and Mac.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Which agreement applies",
          body: [
            'If you downloaded CinemaHUD from the App Store, your license is Apple\'s Licensed Application End User License Agreement (the "Standard EULA", apple.com/legal/internet-services/itunes/dev/stdeula), and the terms below add to it without reducing any right it gives you. If you downloaded the Mac app from this website or from GitHub, this agreement is your license.',
          ],
        },
        {
          heading: "Parties",
          body: [
            'This agreement is between you and Shiv Vyas ("the developer"), not Apple Inc. The developer, not Apple, is solely responsible for CinemaHUD ("the app") and its content.',
          ],
        },
        {
          heading: "License",
          body: [
            "The developer grants you a non-exclusive, non-transferable, revocable license to install and use the app on devices you own or control. For App Store copies, use is also limited by the Usage Rules in the Apple Media Services Terms and Conditions, including Family Sharing where it applies.",
            "You may not rent, lease, sell, redistribute or sublicense the app, or remove any notices from it. Source code published on GitHub is shared for reference and is not licensed for redistribution unless a license file in the repository says otherwise.",
          ],
        },
        {
          heading: "Maintenance and support",
          body: [
            `The developer alone is responsible for any maintenance and support of the app, as described here or as required by law. Apple has no obligation to provide maintenance or support. Contact: ${CONTACT}.`,
          ],
        },
        {
          heading: "Warranty",
          body: [
            "The app is provided as is, to the fullest extent permitted by law. If an App Store copy fails to conform to any warranty that applies by law, you may notify Apple, and Apple will refund the purchase price, if any. To the maximum extent permitted by law, Apple has no other warranty obligation for the app, and any other claims, losses, liabilities, damages, costs or expenses from a failure to conform to a warranty are the developer's responsibility.",
          ],
        },
        {
          heading: "Product claims",
          body: [
            "The developer, not Apple, is responsible for addressing any claims by you or a third party relating to the app or your possession or use of it, including product liability claims, claims that the app fails to conform to any legal or regulatory requirement, and claims under consumer protection, privacy or similar laws.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "If a third party claims that the app or your possession and use of it infringes their intellectual property rights, the developer, not Apple, is solely responsible for the investigation, defence, settlement and discharge of that claim.",
          ],
        },
        {
          heading: "Legal compliance",
          body: [
            "You represent that you are not located in a country subject to a U.S. Government embargo or designated by the U.S. Government as a terrorist-supporting country, and that you are not listed on any U.S. Government list of prohibited or restricted parties.",
          ],
        },
        {
          heading: "Third-party terms",
          body: [
            "You must comply with any third-party terms that apply when using the app, such as the terms of your camera's firmware and network services.",
          ],
        },
        {
          heading: "Third-party beneficiary",
          body: [
            "Apple and its subsidiaries are third-party beneficiaries of this agreement for App Store copies of the app. Once you accept it, Apple has the right, and is deemed to have accepted the right, to enforce this agreement against you as a third-party beneficiary.",
          ],
        },
        {
          heading: "Termination",
          body: [
            "This license is effective until terminated. It ends automatically if you fail to comply with it. When it ends, you must stop using the app and delete it.",
          ],
        },
        {
          heading: "Developer contact",
          body: [`Shiv Vyas, New York, NY, United States. Questions, complaints or claims about the app: ${CONTACT}.`],
        },
      ],
    },
  },
};

const lifeosFocus: AppLegal = {
  app: "LifeOS Focus",
  projectPage: false,
  docs: {
    privacy: {
      title: "Privacy Policy",
      summary:
        "LifeOS Focus collects no personal data. Your sessions and health readings stay on your device; the only network request is fetching scene videos.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Who we are",
          body: [
            'LifeOS Focus for iPhone, iPad and Apple Watch is developed by Shiv Vyas ("we", "us"). This policy covers every version of the app.',
          ],
        },
        {
          heading: "What we collect",
          body: [
            "Nothing. LifeOS Focus has no accounts, no analytics, no advertising or tracking identifiers, and no third-party SDKs that collect data. We never see how, when or where you use the app.",
          ],
        },
        {
          heading: "Apple Health",
          body: [
            "If you allow it, the app reads your heart rate, resting heart rate and heart rate variability from Apple Health so the sound can follow your body, and it writes Mindful Minutes for breathing sessions you finish. Health data is used only on your device to shape the sound and show your readiness. It never leaves your device, is never shared with anyone, and is never used for advertising or marketing.",
          ],
        },
        {
          heading: "Apple Watch",
          body: [
            "During a session the Watch app runs a mindfulness workout session only to receive live heart rate. The workout is discarded when the session ends and is not saved to Apple Health.",
          ],
        },
        {
          heading: "Bluetooth heart-rate straps",
          body: [
            "If you choose to connect one, the app uses Bluetooth to read heart rate from straps that use the standard Heart Rate Service, including WHOOP with Broadcast Heart Rate turned on. Readings are used on your device and are not stored or transmitted anywhere else.",
          ],
        },
        {
          heading: "Your sessions",
          body: [
            "Your listening and breathing history is stored only on your device. If you turn on Connect to LifeOS, each finished session is also written to a file shared with the LifeOS app on the same device through an App Group. Nothing leaves the device.",
          ],
        },
        {
          heading: "Sound and scene videos",
          body: [
            "All music and noise is generated live on your device. Scene videos are streamed from our storage host (Supabase Storage) the first time they play and then cached on your device. Like any web request, this lets the host see your device's IP address, but no personal data, account or identifier is sent with it. The footage is from Pexels and used under the Pexels license.",
          ],
        },
        {
          heading: "Apple",
          body: [
            "If you download LifeOS Focus from the App Store, Apple may collect information under its own privacy policy, such as download and purchase records. We receive only the aggregate, anonymous statistics Apple provides to all developers.",
          ],
        },
        {
          heading: "Children",
          body: [
            "LifeOS Focus is not directed at children under 13. Because it collects no data, no data about anyone is processed.",
          ],
        },
        {
          heading: "Changes",
          body: ["If this policy changes, the new version will appear on this page with a new effective date."],
        },
        {
          heading: "Contact",
          body: [`Questions about privacy: ${CONTACT}.`],
        },
      ],
    },

    terms: {
      title: "Terms of Use",
      summary: "The terms for using LifeOS Focus on iPhone, iPad and Apple Watch.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Agreement",
          body: [
            'By downloading or using LifeOS Focus ("the app") you agree to these terms and to the LifeOS Focus End User License Agreement. Apple\'s Licensed Application End User License Agreement also applies.',
          ],
        },
        {
          heading: "The app",
          body: [
            "LifeOS Focus plays generative soundscapes, noise and guided breathing for focus, relaxation and sleep, provided by Shiv Vyas for personal use.",
          ],
        },
        {
          heading: "Wellness, not medicine",
          body: [
            "LifeOS Focus is a wellness tool, not a medical device. It does not diagnose, treat, cure or prevent any condition, and heart-rate readings and readiness figures are estimates for guidance only. Do not use breathing exercises in place of medical care; stop if you feel dizzy or unwell, and talk to a doctor about any health concern. Do not use the app while driving or operating machinery.",
          ],
        },
        {
          heading: "Provided as is",
          body: [
            'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.',
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the fullest extent permitted by law, Shiv Vyas is not liable for any indirect or consequential loss arising from use of the app.",
          ],
        },
        {
          heading: "Third-party content",
          body: [
            "Scene footage comes from Pexels and is used under the Pexels license. Apple Health, Apple Watch and WHOOP are trademarks of their owners and are named only to describe compatibility.",
          ],
        },
        {
          heading: "Changes to the app or these terms",
          body: [
            "Features may change between versions. Updated terms will appear on this page with a new effective date; continued use after an update means you accept the new terms.",
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about these terms: ${CONTACT}.`],
        },
      ],
    },

    eula: {
      title: "End User License Agreement",
      summary: "The license under which you may use LifeOS Focus on iPhone, iPad and Apple Watch.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Which agreement applies",
          body: [
            'Your license is Apple\'s Licensed Application End User License Agreement (the "Standard EULA", apple.com/legal/internet-services/itunes/dev/stdeula), and the terms below add to it without reducing any right it gives you.',
          ],
        },
        {
          heading: "Parties",
          body: [
            'This agreement is between you and Shiv Vyas ("the developer"), not Apple Inc. The developer, not Apple, is solely responsible for LifeOS Focus ("the app") and its content.',
          ],
        },
        {
          heading: "License",
          body: [
            "The developer grants you a non-exclusive, non-transferable, revocable license to install and use the app on devices you own or control, as limited by the Usage Rules in the Apple Media Services Terms and Conditions, including Family Sharing where it applies.",
            "You may not rent, lease, sell, redistribute or sublicense the app, or extract its scene footage for other use.",
          ],
        },
        {
          heading: "Maintenance and support",
          body: [
            `The developer alone is responsible for any maintenance and support of the app, as described here or as required by law. Apple has no obligation to provide maintenance or support. Contact: ${CONTACT}.`,
          ],
        },
        {
          heading: "Warranty",
          body: [
            "The app is provided as is, to the fullest extent permitted by law. If the app fails to conform to any warranty that applies by law, you may notify Apple, and Apple will refund the purchase price, if any. To the maximum extent permitted by law, Apple has no other warranty obligation for the app, and any other claims, losses, liabilities, damages, costs or expenses from a failure to conform to a warranty are the developer's responsibility.",
          ],
        },
        {
          heading: "Product claims",
          body: [
            "The developer, not Apple, is responsible for addressing any claims by you or a third party relating to the app or your possession or use of it, including product liability claims, claims that the app fails to conform to any legal or regulatory requirement, and claims under consumer protection, privacy or similar laws, including in connection with its use of HealthKit.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "If a third party claims that the app or your possession and use of it infringes their intellectual property rights, the developer, not Apple, is solely responsible for the investigation, defence, settlement and discharge of that claim.",
          ],
        },
        {
          heading: "Legal compliance",
          body: [
            "You represent that you are not located in a country subject to a U.S. Government embargo or designated by the U.S. Government as a terrorist-supporting country, and that you are not listed on any U.S. Government list of prohibited or restricted parties.",
          ],
        },
        {
          heading: "Third-party terms",
          body: ["You must comply with any third-party terms that apply when using the app, such as those of your heart-rate strap's maker."],
        },
        {
          heading: "Third-party beneficiary",
          body: [
            "Apple and its subsidiaries are third-party beneficiaries of this agreement. Once you accept it, Apple has the right, and is deemed to have accepted the right, to enforce this agreement against you as a third-party beneficiary.",
          ],
        },
        {
          heading: "Termination",
          body: [
            "This license is effective until terminated. It ends automatically if you fail to comply with it. When it ends, you must stop using the app and delete it.",
          ],
        },
        {
          heading: "Developer contact",
          body: [`Shiv Vyas, New York, NY, United States. Questions, complaints or claims about the app: ${CONTACT}.`],
        },
      ],
    },

    support: {
      title: "Support",
      summary: "Help with LifeOS Focus: heart rate, scenes, LifeOS, appearance and your data.",
      effective: "October 27, 2026",
      sections: [
        {
          heading: "Contact",
          body: [
            `Email ${CONTACT} with your question, your device and the app version (Settings › General › About lists your iOS version; the app version is on its App Store page). We usually reply within two working days.`,
          ],
        },
        {
          heading: "Where does my heart rate come from?",
          body: [
            "From whichever source is live: an Apple Watch running the LifeOS Focus Watch app during a session, a Bluetooth heart-rate strap you connect in Settings (including WHOOP with Broadcast Heart Rate turned on in the WHOOP app), or your latest readings in Apple Health. Turn on Heart-led sound in Settings to let it shape the music.",
          ],
        },
        {
          heading: "Why does a scene take a moment the first time?",
          body: [
            "Scene videos stream the first time you play them and are saved on your device after that, so later plays start instantly and work offline. Until a video is ready you see a still of its first frame.",
          ],
        },
        {
          heading: "How do I connect LifeOS?",
          body: [
            "Install LifeOS on the same device, then turn on Connect to LifeOS in LifeOS Focus Settings. Each finished session is then handed to LifeOS on the device.",
          ],
        },
        {
          heading: "How do I switch between light and dark?",
          body: [
            "Open Settings in the app and choose Appearance: System follows your device, or pick Light or Dark. Noise, breathing and sleep screens stay dark at night-friendly brightness either way.",
          ],
        },
        {
          heading: "How do I delete my data?",
          body: [
            "Everything the app stores lives on your device. Deleting the app removes your session history, settings and cached videos. Mindful Minutes the app wrote to Apple Health stay in Health; manage or delete them in the Health app under Mindfulness, and change the app's Health access in Health › Profile › Apps.",
          ],
        },
      ],
    },
  },
};

export const legalDocs: Record<string, AppLegal> = { cinemahud, "lifeos-focus": lifeosFocus };
