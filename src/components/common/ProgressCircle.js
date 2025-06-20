// src/components/common/ProgressCircle.js
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Container = styled(View)`
  align-items: center;
  justify-content: center;
`;

const ProgressContainer = styled(View)`
  position: relative;
  align-items: center;
  justify-content: center;
`;

const TextContainer = styled(View)`
  position: absolute;
  align-items: center;
  justify-content: center;
`;

const PercentageText = styled(Text)`
  font-size: ${props => props.size === 'large' ? '32px' : '24px'};
  font-weight: ${typography.weights.bold};
  color: ${colors.text};
`;

const LabelText = styled(Text)`
  font-size: ${props => props.size === 'large' ? '16px' : '14px'};
  color: ${colors.gray600};
  margin-top: 4px;
`;

const SubLabelText = styled(Text)`
  font-size: ${props => props.size === 'large' ? '14px' : '12px'};
  color: ${colors.gray500};
  text-align: center;
  margin-top: 2px;
`;

const ProgressCircle = ({
  percentage = 0,
  size = 'medium', // 'small', 'medium', 'large'
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = colors.gray200,
  showPercentage = true,
  label,
  subLabel,
  animationDuration = 1000,
  style,
}) => {
  const animatedValue = useSharedValue(0);
  
  // Configuración del círculo basada en el tamaño
  const getCircleConfig = () => {
    switch (size) {
      case 'small':
        return { radius: 40, strokeWidth: 6, center: 50 };
      case 'large':
        return { radius: 80, strokeWidth: 12, center: 100 };
      default:
        return { radius: 60, strokeWidth: 8, center: 80 };
    }
  };

  const { radius, center } = getCircleConfig();
  const actualStrokeWidth = strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const svgSize = (radius + actualStrokeWidth) * 2;

  useEffect(() => {
    animatedValue.value = withTiming(percentage / 100, {
      duration: animationDuration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [percentage, animationDuration]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedValue.value);
    
    return {
      strokeDashoffset,
    };
  });

  return (
    <Container style={style}>
      <ProgressContainer>
        <Svg 
          width={svgSize} 
          height={svgSize}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={actualStrokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          
          {/* Progress circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={actualStrokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </Svg>
        
        {/* Text overlay */}
        <TextContainer>
          {showPercentage && (
            <PercentageText size={size}>
              {Math.round(percentage)}%
            </PercentageText>
          )}
          {label && (
            <LabelText size={size}>
              {label}
            </LabelText>
          )}
          {subLabel && (
            <SubLabelText size={size}>
              {subLabel}
            </SubLabelText>
          )}
        </TextContainer>
      </ProgressContainer>
    </Container>
  );
};

export default ProgressCircle;