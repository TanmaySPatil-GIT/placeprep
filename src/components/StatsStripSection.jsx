import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter component using requestAnimationFrame for smooth ease-out count-up animation
 */
function AnimatedCounter({ endValue, duration = 1500, prefix = '', suffix = '', isVisible }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCount(0);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Smooth ease-out cubic curve (decelerates towards end)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * endValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible, endValue, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsStripSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver to trigger animation when scrolled into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      id: 'students',
      value: 10,
      prefix: '',
      suffix: 'K+',
      label: 'Students Trained',
      sublabel: 'Active candidate community'
    },
    {
      id: 'companies',
      value: 250,
      prefix: '',
      suffix: '+',
      label: 'Companies Tracked',
      sublabel: 'FAANG & Tier-1 hiring patterns'
    },
    {
      id: 'success-rate',
      value: 95,
      prefix: '',
      suffix: '%',
      label: 'Success Rate',
      sublabel: 'Benchmarked interview outcomes'
    },
    {
      id: 'mock-tests',
      value: 50,
      prefix: '',
      suffix: '+',
      label: 'Mock Tests',
      sublabel: 'Simulated recruitment drives'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative rounded-[28px] p-6 sm:p-10 bg-[#FDF4EC] border border-warmborder shadow-warm-sm my-8"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-warmborder/80 text-center">
        {stats.map((stat, idx) => (
          <div key={stat.id} className={`space-y-1.5 ${idx > 0 ? 'pt-4 md:pt-0 md:px-4' : 'px-2'} flex flex-col items-center justify-center`}>
            
            {/* Animated Large Bold Number (Sora / Heading Font) */}
            <div className="font-heading text-3xl sm:text-5xl font-extrabold text-warmtext-900 tracking-tight">
              <AnimatedCounter 
                endValue={stat.value} 
                duration={1500} 
                prefix={stat.prefix} 
                suffix={stat.suffix} 
                isVisible={isVisible} 
              />
            </div>

            {/* Label (Inter / Sans Font) */}
            <div className="space-y-0.5">
              <h4 className="font-sans text-xs sm:text-sm font-bold text-rust-500 uppercase tracking-wider">
                {stat.label}
              </h4>
              <p className="font-sans text-[11px] text-warmtext-500 line-clamp-1">
                {stat.sublabel}
              </p>
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}
