import { useSpring, animated } from '@react-spring/web';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const AnimatedNumber = ({ value, duration = 2000, prefix = '', suffix = '' }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });
  
  const [hasAnimated, setHasAnimated] = useState(false);

  const props = useSpring({
    val: hasAnimated && inView ? value : 0,
    from: { val: 0 },
    config: { duration },
  });

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [inView, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}
      <animated.span>
        {props.val.to(val => Math.floor(val).toLocaleString())}
      </animated.span>
      {suffix}
    </span>
  );
};

export default AnimatedNumber;