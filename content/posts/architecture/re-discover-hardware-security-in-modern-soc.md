---
title: "Re-discover Hardware Security in Modern SoC"
date: 2019-01-30
aliases:
  - "/blog/arch/2019-01-30-rediscover-hardware-security-in-modern-soc/"
---

There is a big difference between how I used to understand hardware security and state-of-the-art security supported by hardware software co-design, after I watched some video talking about SEP (Security Enclave Processor) by Apple. It’s a key component in current iPhone to protect user data and password from being observed in any kind of hacking, including traditional side channel attack such as DPA (Dynamic Power Attack), debug channel attack, normal network attack, and etc.

The idea itself is not such an amazing break through, but the architecture level design and engineering effort to put all of CPU cores, SEP core, coherency system, boot loader, iOS kernel, and applications together and make it not only work but also pitfall proof for any future attacks from hackers to government agents is really AMAZING. I could not think of any other companies in the whole world can ever pull this off, not now, not in the near future. One big reason is no other companies owns everything from chip design, system integration, operating system and control of applications in the ECO system. This is one of the biggest advantage of Apple in the mobile era.

Tim Cook obviously understands this very clearly. And that’s the reason why he refused firmly to open back door for FBI in the name of national security. Not only because American people don’t trust their government, (they should not! And nobody should to their own neither) but also that is a very good statement to show that Apple understand how serious security is, obviously more serious than some government orders.

Back to technology. Obviously, to understand the whole thing about hardware security, as well as software hardware co-design, it’s a long way to go.
