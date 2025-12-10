import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            {/* Testimonials would go here */}
            <Footer />
        </div>
    );
};

export default LandingPage;
