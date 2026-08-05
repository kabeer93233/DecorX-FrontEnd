import React from 'react';
import { SectionHeading } from '../components/ui/SectionHeading';

export const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">About DecorX</h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto">
          We believe that your home should be a reflection of your personality and style.
        </p>
      </div>

      {/* Story Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="order-2 md:order-1">
           <img 
             src="https://images.unsplash.com/photo-1620954799930-76530e07ea5b?auto=format&fit=crop&q=80&w=1000" 
             alt="Our Workshop" 
             className="rounded-3xl w-full h-auto shadow-lg"
           />
        </div>
        <div className="order-1 md:order-2">
           <h2 className="text-3xl font-bold text-stone-900 mb-6">Our Story</h2>
           <p className="text-stone-600 mb-4 leading-relaxed">
             Founded in 2010, DecorX started with a simple mission: to make high-quality, modern furniture accessible to everyone. We started as a small workshop in downtown, crafting bespoke pieces for local clients.
           </p>
           <p className="text-stone-600 mb-4 leading-relaxed">
             Over the years, our passion for design and craftsmanship has grown into a global brand. We collaborate with designers from around the world to bring you collections that inspire.
           </p>
           <p className="text-stone-600 leading-relaxed">
             Today, we are proud to serve thousands of happy customers, helping them create spaces they love coming home to.
           </p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-stone-50 rounded-3xl p-12 mb-20">
         <SectionHeading title="Our Core Values" alignment="center" />
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mt-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
               <h3 className="text-xl font-bold text-stone-900 mb-3">Quality First</h3>
               <p className="text-stone-600">We never compromise on materials or craftsmanship. Every piece is built to last.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
               <h3 className="text-xl font-bold text-stone-900 mb-3">Sustainable Design</h3>
               <p className="text-stone-600">We are committed to eco-friendly practices and sourcing sustainable materials.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
               <h3 className="text-xl font-bold text-stone-900 mb-3">Customer Happiness</h3>
               <p className="text-stone-600">Your satisfaction is our top priority. We're here to help at every step.</p>
            </div>
         </div>
      </div>

      {/* Team (Optional Mock) */}
      <div>
         <SectionHeading title="Meet The Team" />
         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="group">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-stone-200">
                     <img 
                       src={`https://images.unsplash.com/photo-${i === 1 ? '1653674136728-a24982136e60' : i === 2 ? '1634552516330-ab1ccc0f605e' : i === 3 ? '1653674136728-a24982136e60' : '1634552516330-ab1ccc0f605e'}?auto=format&fit=crop&q=80&w=600`} 
                       alt="Team Member" 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                  </div>
                  <h3 className="font-bold text-stone-900 text-lg">Alex Johnson</h3>
                  <p className="text-stone-500">Lead Designer</p>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};
