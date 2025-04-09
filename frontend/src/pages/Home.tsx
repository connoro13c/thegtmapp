// React is imported for JSX compilation
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 text-center bg-gradient-to-b from-white to-background-offset">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Scale your GTM without RevOps</h1>
          <p className="text-xl mb-6 text-gray-700">Stop wasting time with disjointed systems and processes</p>
          
          {/* Outcome Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"> 
            
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-background-offset">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">Define your ICP, score your accounts, and segment territories in 15 minutes or less</h2>
            <div className="mt-6 mb-8">
              <Link
                to="/trial"
                className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-md inline-flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                Start your trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
          
          <div className="relative">
            {/* Connector Line */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gray-200 hidden md:block"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative z-10"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
                    <div className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 text-lg font-bold">
                      {step.timeEstimate}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-3 flex-grow text-sm">{step.description}</p>
                    <div className="text-primary font-medium mt-auto flex items-center text-sm">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-bold mb-3">Everything You Need in One Platform</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">No more bouncing between tools. One platform for your entire GTM strategy.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <div className="h-5 w-5 text-primary">{capability.icon || <CheckCircle />}</div>
                </div>
                <h3 className="text-lg font-bold mb-2">{capability.title}</h3>
                <p className="text-gray-600 text-sm">{capability.description}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 text-primary font-medium flex items-center text-xs">
                  Typically takes {capability.timeEstimate} to set up <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose The GTM App</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Scale GTM without RevOps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' }}
              >
                <div className="mb-4 text-accent">
                  {benefit.icon || <CheckCircle className="h-8 w-8" />}
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-4 bg-background-offset">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">From Setup to ROI in Minutes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Real GTM results from real customers</p>
          </motion.div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-md p-8 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="text-6xl font-bold text-primary">10</div>
                <div className="ml-4">
                  <div className="font-bold text-xl">minutes</div>
                  <div className="text-gray-500">to first insights</div>
                </div>
              </div>
              <blockquote className="text-lg font-medium mb-6 text-gray-700">
                "We scored our entire database in 10 minutes. What used to take weeks now takes minutes."
              </blockquote>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <p className="font-bold">John Smith</p>
                  <p className="text-gray-600 text-sm">RevOps, SaaS Company</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-md p-8 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="text-6xl font-bold text-primary">15</div>
                <div className="ml-4">
                  <div className="font-bold text-xl">minutes</div>
                  <div className="text-gray-500">to build territories</div>
                </div>
              </div>
              <blockquote className="text-lg font-medium mb-6 text-gray-700">
                "Balanced territories in 15 minutes that would have taken us days of work. No politics or disputes."
              </blockquote>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <p className="font-bold">Sarah Johnson</p>
                  <p className="text-gray-600 text-sm">VP RevOps, Enterprise Tech</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-md p-8 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="text-6xl font-bold text-primary">1</div>
                <div className="ml-4">
                  <div className="font-bold text-xl">day</div>
                  <div className="text-gray-500">to full GTM rollout</div>
                </div>
              </div>
              <blockquote className="text-lg font-medium mb-6 text-gray-700">
                "Our entire GTM strategy built, deployed, and delivering value in one day. It's a game-changer."
              </blockquote>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <p className="font-bold">Michael Chang</p>
                  <p className="text-gray-600 text-sm">CRO, Growth Startup</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <h3 className="text-xl mb-10 font-semibold">Trusted by innovative teams</h3>
            <div className="flex flex-wrap justify-center gap-12 items-center">
              {/* Placeholder for company logos */}
              {[1, 2, 3, 4, 5].map((logo) => (
                <div key={logo} className="h-8 w-32 bg-gray-300 rounded opacity-70 hover:opacity-100 transition-opacity"></div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Start in 15 Minutes, No Bullshit</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">Score up to 10k accounts in less than 15 minutes — plus keep all your data.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">What you'll get:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>Complete account scoring for your entire database</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>Optimized territories built in minutes, not days</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>Auto-assignments that eliminate territory disputes</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Why users love us:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>"We were up and running in 10 minutes flat"</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>"No more spreadsheets, just one place for our GTM"</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>"The time-to-value ratio is unmatched"</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/trial"
                className="bg-primary hover:bg-primary/90 text-white font-medium py-4 px-10 rounded-md inline-flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg text-lg"
              >
                Start Now — Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <p className="mt-6 text-center text-gray-500">No credit card required. 15-minute setup. Keep your data.</p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Data arrays
const capabilities = [
  {
    title: 'Account Scoring',
    description: 'Identify your best-fit accounts with no-BS scoring that actually works.',
    timeEstimate: '10 minutes',
    icon: undefined
  },
  {
    title: 'Segmentation & Targeting',
    description: 'Create clear, actionable segments with drag-and-drop simplicity.',
    timeEstimate: '15 minutes',
    icon: undefined
  },
  {
    title: 'Territory Design',
    description: 'Build balanced territories in minutes, not weeks. Auto-optimized for results.',
    timeEstimate: '25 minutes',
    icon: undefined
  },
  {
    title: 'Account Assignment',
    description: 'Automatically match the right accounts to the right reps. No politics.',
    timeEstimate: '10 minutes',
    icon: undefined
  },
  {
    title: 'Quota & Goal Setting',
    description: 'Set achievable, data-driven quotas aligned to your business goals.',
    timeEstimate: '20 minutes',
    icon: undefined
  }
];

const steps = [
  {
    title: 'Define your ICP',
    description: 'Tell us who your ideal customer is with our guided process. No complex setup.',
    timeEstimate: '2 min'
  },
  {
    title: 'Score your accounts',
    description: 'Upload your accounts and get AI-powered scoring with clear insights immediately.',
    timeEstimate: '5 min'
  },
  {
    title: 'Segment your business',
    description: 'Seamlessly build territories, assign accounts, and set quotas in one workflow.',
    timeEstimate: '8 min'
  }
];

const benefits = [
  {
    title: 'Fast Time-to-Value',
    description: 'Actionable insights in minutes.',
    icon: undefined
  },
  {
    title: 'Built for RevOps',
    description: 'Specifically designed for your complexity.',
    icon: undefined
  },
  {
    title: 'Flexibility to Scale',
    description: 'Simple start, advanced scalability.',
    icon: undefined
  },
  {
    title: 'Single Source of Truth',
    description: 'One unified GTM platform.',
    icon: undefined
  }
];

export default Home;