import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ShieldCheck, Zap, Star,
  ChevronLeft, ChevronRight, ShoppingBag,
} from 'lucide-react';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ProductCard } from '../components/ui/ProductCard';
import { testimonials } from '../data/products';
import { Product } from '../types';
import custom_axios from '../axios/axios';

// ─── ID Config ────────────────────────────────────────────────────────────────

const HERO_IDS      = ['474', '515', '546'];
const GALLERY_IDS   = ['473', '523', '511']; 
const CATEGORY_IDS  = ['472', '541', '558', '480'];
const POPULAR_POOL  = ['480', '515', '490', '522'];

const GALLERY_LABELS: Record<string, string> = {
  '388': 'Table',
  '365': 'Chair',
  '421': 'Decoration',
};

// ─── Testimonial Slider Settings ──────────────────────────────────────────────

const testimonialSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 2 } },
    { breakpoint: 640,  settings: { slidesToShow: 1 } },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArr<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1080&auto=format&fit=crop';

// ─── Component ────────────────────────────────────────────────────────────────

export const Home = () => {
  const navigate = useNavigate();

  const [heroProducts,     setHeroProducts]     = useState<Product[]>([]);
  const [galleryProducts,  setGalleryProducts]  = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [popularProducts,  setPopularProducts]  = useState<Product[]>([]);
  const [storyImages,      setStoryImages]      = useState<[string, string]>([FALLBACK_IMG, FALLBACK_IMG]);
  const [currentSlide,     setCurrentSlide]     = useState(0);
  const [loading,          setLoading]          = useState(true);

  // ── Fetch ALL, filter by ID ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await custom_axios.get('/product');
        const all: Product[] = Array.isArray(res.data) ? res.data : [];

        const byIds = (ids: string[]): Product[] =>
          ids
            .map((id) => all.find((p) => String(p.id) === id))
            .filter((p): p is Product => p !== undefined);

        setHeroProducts(byIds(HERO_IDS));
        setGalleryProducts(byIds(GALLERY_IDS));
        setCategoryProducts(byIds(CATEGORY_IDS));

        const pool = byIds(POPULAR_POOL);
        const shuffled = shuffleArr(pool);
        setPopularProducts(shuffled.slice(0, 4));

        const storyPicks = shuffleArr(pool).slice(0, 2);
        setStoryImages([
          storyPicks[0]?.image || FALLBACK_IMG,
          storyPicks[1]?.image || FALLBACK_IMG,
        ]);
      } catch (err) {
        console.error('Home fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Hero auto-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!heroProducts.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % heroProducts.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + heroProducts.length) % heroProducts.length);

  const current = heroProducts[currentSlide];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-24 pb-24">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#FFF8F0] pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-50/50 skew-x-12 transform origin-top-right -z-0" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6 border border-orange-100">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm font-medium text-stone-600">New Collection 2025</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-stone-900 leading-[1.1] mb-6 tracking-tight">
                Design Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
                  Dream Space
                </span>
              </h1>

              <p className="text-lg md:text-xl text-stone-600 mb-8 font-light max-w-lg leading-relaxed">
                Experience the perfect blend of aesthetic appeal and functional design.
                Elevate your home with our premium furniture collection.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link
                  to="/shop"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-stone-900 text-white font-medium rounded-full shadow-xl hover:bg-orange-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border border-stone-200 text-stone-700 font-medium rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow-md"
                >
                  View Collection
                </Link>
              </div>

              <div className="flex items-center gap-8 md:gap-12 pt-8 border-t border-stone-200/60">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-stone-900">500+</span>
                  <span className="text-sm text-stone-500 font-medium">Unique Items</span>
                </div>
                <div className="w-px h-12 bg-stone-200" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-stone-900">12k+</span>
                  <span className="text-sm text-stone-500 font-medium">Happy Clients</span>
                </div>
                <div className="w-px h-12 bg-stone-200" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-stone-900">24/7</span>
                  <span className="text-sm text-stone-500 font-medium">Support</span>
                </div>
              </div>
            </motion.div>

            {/* Image Slider */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center items-center h-[500px] w-full"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white rounded-full shadow-2xl z-0" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-orange-100 rounded-full z-0"
              />

              <div className="relative w-full max-w-md aspect-square z-10">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <div key="skeleton" className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 rounded-full bg-stone-100 animate-pulse" />
                    </div>
                  ) : current ? (
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                    <img
                      src={current.image || FALLBACK_IMG}
                      alt={current.productName}
                      className="w-[70%] h-full object-cover rounded-3xl drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                    />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute bottom-10 right-0 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50"
                      >
                        <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider mb-1 truncate max-w-[140px]">
                          {current.productName}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xl font-bold text-stone-900">
                            ${current.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => navigate('/shop')}
                            className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <button
                  onClick={prevSlide}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-stone-100 flex items-center justify-center text-stone-600 hover:text-orange-500 hover:border-orange-200 transition-all z-20 group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-stone-100 flex items-center justify-center text-stone-600 hover:text-orange-500 hover:border-orange-200 transition-all z-20 group"
                >
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {heroProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? 'w-8 bg-orange-500' : 'w-2 bg-stone-300 hover:bg-stone-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Explore Our Gallery ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Explore Our Gallery" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="h-80 rounded-3xl bg-stone-100 animate-pulse" />
              ))
            : galleryProducts.map((product, idx) => (
                <Link to="/shop" key={product.id} className="block h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative bg-stone-100 rounded-3xl overflow-hidden h-80 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={product.image || FALLBACK_IMG}
                      alt={product.productName}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-6 left-6 text-white transform transition-transform duration-300 group-hover:translate-y-[-5px]">
                      <h3 className="text-2xl font-bold mb-2">
                        {GALLERY_LABELS[String(product.id)] ?? product.category}
                      </h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 text-sm font-medium text-orange-300">
                        <span>Shop Collection</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 rotate-45 group-hover:rotate-0">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </motion.div>
                </Link>
              ))}
        </div>
      </section>

      {/* ── About Us ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100">
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <>
                <div className="rounded-2xl w-full h-64 bg-stone-100 animate-pulse" />
                <div className="rounded-2xl w-full h-64 bg-stone-100 animate-pulse mt-8" />
              </>
            ) : (
              <>
                <img
                  src={storyImages[0]}
                  alt="About 1"
                  className="rounded-2xl w-full h-64 object-cover hover:shadow-lg transition-all"
                />
                <img
                  src={storyImages[1]}
                  alt="About 2"
                  className="rounded-2xl w-full h-64 object-cover mt-8 hover:shadow-lg transition-all"
                />
              </>
            )}
          </div>
          <div>
            <span className="text-orange-500 font-bold tracking-wide uppercase text-sm mb-2 block">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6 leading-tight">
              We Create <span className="text-orange-500">Stylish</span> & Modern Furniture
            </h2>
            <p className="text-stone-600 mb-6 leading-relaxed text-lg">
              We create stylish and modern furniture that is both functional and beautiful. Discover our unique
              collections and transform your home into a haven of comfort and elegance.
            </p>
            <Link
              to="/about"
              className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors shadow-lg"
            >
              Read More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Shop by Categories ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <SectionHeading title="Shop by Categories" />
          <Link
            to="/shop"
            className="text-orange-500 font-medium hover:underline mb-12 flex items-center gap-1 group"
          >
            View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-stone-100 animate-pulse" />
              ))
            : categoryProducts.map((product) => (
                <Link
                  to={`/shop?category=${product.category}`}
                  key={product.id}
                  className="group relative block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img
                      src={product.image || FALLBACK_IMG}
                      alt={product.productName}
                      className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 z-20 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 w-[90%]">
                      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl flex items-center justify-between shadow-lg">
                        <span className="font-semibold text-stone-900 text-sm truncate">
                          {product.category}
                        </span>
                        <ArrowRight className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-[#FFF8F0] rounded-3xl p-8 h-96 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl -ml-32 -mb-32 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <img
              src="https://images.unsplash.com/photo-1603192399946-8bbb0703cfc4?auto=format&fit=crop&q=80&w=800"
              alt="Why Choose Us"
              className="max-h-full max-w-full object-contain mix-blend-multiply relative z-10 drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div>
            <SectionHeading title="Why Choose DecorX?" />
            <div className="space-y-6">
              <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 border border-transparent hover:border-orange-100 cursor-default">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-stone-900">Fast Shipping</h4>
                  <p className="text-stone-600 text-sm mt-1">We deliver your furniture quickly and safely to your doorstep with real-time tracking.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 border border-transparent hover:border-blue-100 cursor-default">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-stone-900">Exclusive Design</h4>
                  <p className="text-stone-600 text-sm mt-1">Unique and modern designs that stand out from the crowd, curated by top designers.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300 border border-transparent hover:border-green-100 cursor-default">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-500 flex-shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-stone-900">Lifetime Warranty</h4>
                  <p className="text-stone-600 text-sm mt-1">Quality assurance with our comprehensive warranty coverage for your peace of mind.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular Products ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <SectionHeading title="Popular Products" />
          <Link to="/shop" className="text-orange-500 font-medium hover:underline mb-12">View All</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── AI Decor Promo Banner ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-3xl p-12 md:p-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-medium text-white">NEW FEATURE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Try Furniture in Your Room with AI
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Visualize how any furniture piece looks in your space before you buy.
              Upload a photo of your room and see it transformed instantly with our AI-powered preview tool.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/ai-preview"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-purple-600 font-bold rounded-full shadow-2xl hover:bg-stone-50 transition-all transform hover:-translate-y-1"
              >
                <span className="text-2xl">✨</span>
                Try AI Preview Now
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all"
              >
                Browse Furniture
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Client Reviews ────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Our Client Reviews" alignment="center" />
          <div className="mt-12">
            <Slider {...testimonialSettings}>
              {testimonials.map((t) => (
                <div key={t.id} className="px-4">
                  <div className="bg-[#FFF8F0] p-8 rounded-2xl text-center hover:shadow-lg transition-shadow duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-center mb-4 text-orange-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-stone-600 italic mb-6">"{t.text}"</p>
                    <h4 className="font-bold text-stone-900">{t.name}</h4>
                    <span className="text-xs text-stone-400">{t.role}</span>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-100 rounded-3xl p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-stone-600 mb-8">Get the latest news, special offers, and interior design tips directly to your inbox.</p>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-6 py-3 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full shadow-lg hover:bg-orange-600 transition-colors"
              >
                Subscribe Now
              </button>
            </form>
          </div>
          <div className="flex justify-center">
            <div className="bg-orange-100 p-8 rounded-full h-64 w-64 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1742714684748-5a5a8a21115a?auto=format&fit=crop&q=80&w=400"
                alt="Newsletter"
                className="w-40 h-auto object-contain mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};