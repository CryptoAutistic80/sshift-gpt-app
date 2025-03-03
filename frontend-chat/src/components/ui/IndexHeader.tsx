'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from './dialog';
import Link from 'next/link';
import Image from 'next/image';

export function IndexHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="w-full max-w-4xl mx-auto flex flex-col items-center py-6">
        <div className="flex justify-center space-x-4 [&>*]:px-1 sm:space-x-8 sm:[&>*]:px-0">
          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              About SShift
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6 landscape:h-[95vh]">
              <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
                <DialogTitle className="text-2xl font-bold text-gray-800 mb-6">
                  About SShift
                </DialogTitle>
                <p>
                  Founded in 2023 by Crypto Autistic an active and engaged
                  participant in the Aptos ecosystem since main net, SShift
                  emerged as a testament to the transformative power of
                  creativity and technology. With a humble beginning, the
                  founder embarked on a journey to explore the intersection of
                  artificial intelligence and community building. Starting with
                  a passion for AI Discord bots and the guidance of 3.5-turbo,
                  he crafted innovative tools and nurtured an engaged NFT
                  community through the Move Bot Collection, a limited
                  111-supply masterpiece. These early successes laid the
                  foundation for what SShift would become.
                </p>
                <p>
                  Today, SShift has grown into a dynamic team of two, united by
                  a shared mission: to create AI experiences that are useful,
                  fun, and educational. Our portfolio has expanded to include
                  the Qribbles and SShift Records collections (supplies 3333 &
                  598 respectively), showcasing our commitment to pushing
                  boundaries and delivering value to our community.
                </p>
                <p>
                  At SShift, we believe in the endless possibilities of AI and
                  its potential to inspire, educate, and entertain. Join us as
                  we continue to innovate, create, and shape the future of
                  AI-driven experiences.
                </p>
                <p>
                  SShift GPT, our flagship offering, provides flexible on-chain
                  subscriptions ranging from 1 to 30 days, making foundational
                  AI models accessible to everyone, including the unbanked.
                  We've developed a suite of custom tools for the AI, ensuring
                  an enhanced and seamless experience. This launch marks just
                  the beginning, with many more innovations to follow in the
                  weeks, months, and years ahead.
                </p>
                <p className="font-medium italic">
                  We aim to become an immutable part of Aptos history, leaving a
                  lasting legacy on the ledger.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              How to Use
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6 landscape:h-[95vh]">
              <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
                <DialogTitle className="text-2xl font-bold text-gray-800 mb-6">
                  How to Use SShift GPT
                </DialogTitle>
                <p>
                  Using SShift GPT is simple and designed to ensure
                  accessibility for all users, regardless of experience level.
                  Follow these steps to get started:
                </p>
                <p>
                  1. Subscribe to SShift GPT SShift GPT offers a single,
                  straightforward subscription plan. Navigate to our
                  subscription portal, connect your Aptos-compatible wallet, and
                  you'll be taken to our subscription dashboard to confirm the
                  transaction. For those holding Move Bots, Qribbles, or SShift
                  Records NFTs, you can enjoy a discount of up to 50% off your
                  subscription price. Ensure your eligible NFTs are in your
                  wallet when subscribing to automatically apply the discount.
                </p>
                <p>
                  2. Set Up Your Wallet Make sure you have an Aptos-compatible
                  wallet. If you don't already have one, you can set up a wallet
                  like Petra or Martian and fund it with APT tokens for seamless
                  transactions. Payments are made in Aptos USDT and will soon
                  support USDC as well.
                </p>
                <p>
                  3. Explore the Custom Tools Dive into our user-friendly
                  interface to explore the features we've developed. From
                  educational AI resources to fun and creative applications,
                  SShift GPT offers a wide range of possibilities to suit
                  different interests and needs.
                </p>
                <p>
                  4. Engage and Experiment Make the most of your subscription by
                  trying out various AI tools. Whether you're seeking
                  assistance, education, or entertainment, SShift GPT is here to
                  deliver a seamless experience.
                </p>
                <p>
                  5. Renew or Extend Your Subscription When your subscription
                  expires, you can easily renew it through our platform. Simply
                  connect your wallet and confirm the transaction.
                </p>
                <p>
                  6. Communicate Effectively with AI To get the best results
                  from SShift GPT, remember that it's trained on human
                  communication. Speak to it as you would to another person: be
                  clear, concise, and specific. Feel free to ask follow-up
                  questions or clarify your requests to refine the AI's
                  responses. Engaging with it naturally will enhance your
                  experience and unlock its full potential.
                </p>
                <p>
                  If you have any questions or encounter any issues, our support
                  team is ready to help. Let SShift GPT redefine your AI
                  experience with tools that inspire, educate, and entertain.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              Custom Tools
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6 landscape:h-[95vh]">
              <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
                <DialogTitle className="text-2xl font-bold text-gray-800 mb-6">
                  Custom Tools
                </DialogTitle>
                <p>
                  SShift GPT comes equipped with a powerful suite of custom
                  tools designed to enhance your AI experience. While our AI is
                  intelligent enough to determine when to use these tools, you
                  can also specifically request them when you know what you
                  need. To explicitly use a tool, simply mention it in your
                  request. For example, "Can you use DALL-E to create an image
                  of..." or "Could you search Wikipedia for information
                  about..."
                </p>

                <p className="font-semibold text-gray-800">
                  Image Generation (DALL-E 3)
                </p>
                <p>
                  • Create stunning images in various sizes (1024x1024,
                  1792x1024, or 1024x1792)
                  <br />
                  • Choose between vivid or natural styles
                  <br />• Simply describe what you want to see
                </p>

                <p className="font-semibold text-gray-800">
                  Web & Knowledge Search
                </p>
                <p>
                  • Web Search: Get real-time information from the internet
                  <br />
                  • Wikipedia Search: Access detailed, verified information
                  <br />• arXiv Search: Find academic papers with custom sorting
                  by relevance or date
                </p>

                <p className="font-semibold text-gray-800">Financial Tools</p>
                <p>
                  • Stock Information: Get prices, dividends, splits, company
                  info
                  <br />
                  • Crypto Market Data: Real-time data from CoinMarketCap
                  <br />• Trending Cryptos: View by popularity, gains, or market
                  cap
                </p>

                <p className="font-semibold text-gray-800">
                  NFT & Blockchain Tools
                </p>
                <p>
                  • NFT Collection Search: Find collections on Aptos blockchain
                  <br />
                  • Trending NFTs: Discover trending collections by
                  volume/trades
                  <br />
                  • Personal NFT Portfolio: View your wallet's collections
                  <br />• Social Blockchain Data: Access trending topics and
                  analytics
                </p>

                <p className="font-semibold text-gray-800">Creative Tools</p>
                <p>
                  • Sound Effect Generation: Create custom audio effects
                  <br />
                  • Control duration and prompt influence
                  <br />• Add an audio dimension to your AI experience
                </p>

                <p className="font-semibold text-gray-800">Pro Tips</p>
                <p>
                  • Be specific when requesting tool usage
                  <br />
                  • Combine multiple tools for comprehensive results
                  <br />
                  • For financial data, specify exactly what information you
                  need
                  <br />
                  • When generating images or sounds, provide detailed
                  descriptions
                  <br />• For research, use precise keywords and sorting
                  preferences
                </p>

                <p>
                  Our AI will intelligently select and combine these tools to
                  provide the best possible responses to your queries. Feel free
                  to experiment with different combinations and approaches to
                  make the most of these powerful features.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              Contact Us
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6 landscape:h-[95vh]">
              <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
                <DialogTitle className="text-2xl font-bold text-gray-800 mb-6">
                  Contact Us
                </DialogTitle>
                <p>
                  Have questions or need assistance? Our vibrant Discord
                  community is the primary hub for support, where our team and
                  experienced community members are ready to help you get the
                  most out of SShift GPT.
                </p>
                <p className="font-bold text-red-600">
                  🛡️ Security Notice: Protect yourself from scams. The SShift
                  team will never request your private keys, seed phrases, or
                  wallet access. We do not initiate private messages - all
                  legitimate support happens in our public channels.
                </p>
                <p>
                  For business partnerships and professional inquiries, please
                  reach out to us at{' '}
                  <a
                    href="james@sshiftgpt.com"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    james@sshiftgpt.com
                  </a>
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4">
          <a
            href="https://ledgerapp.fun/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base"
          >
            SShift 📒 Token
          </a>
        </div>
      </nav>
    </header>
  );
}
