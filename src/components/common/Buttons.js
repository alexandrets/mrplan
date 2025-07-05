// src/components/common/Button.js
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '../../styles/colors';
import { typography, spacing, borderRadius } from '../../utils/constants';

const StyledButton = styled(TouchableOpacity)`
  background-color: ${props => {
    if (props.disabled) return colors.gray300;
    switch (props.variant) {
      case 'secondary': return colors.surface;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  }};
  border: ${props => {
    switch (props.variant) {
      case 'outline': return `1px solid ${colors.primary}`;
      case 'secondary': return `1px solid ${colors.gray200}`;
      default: return 'none';
    }
  }};
  border-radius: ${props => props.borderRadius || borderRadius.md}px;
  padding: ${props => {
    switch (props.size) {
      case 'small': return `${spacing.sm}px ${spacing.md}px`;
      case 'large': return `${spacing.lg}px ${spacing.xl}px`;
      default: return `${spacing.md}px ${spacing.lg}px`;
    }
  }};
  align-items: center;
  justify-content: center;
  flex-direction: row;
  min-height: ${props => {
    switch (props.size) {
      case 'small': return '32px';
      case 'large': return '56px';
      default: return '44px';
    }
  }};
  opacity: ${props => props.disabled ? 0.6 : 1};
  shadow-color: ${props => props.variant === 'primary' ? colors.primary : 'transparent'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: ${props => props.variant === 'primary' ? 2 : 0};
`;

const ButtonText = styled(Text)`
  color: ${props => {
    switch (props.variant) {
      case 'outline': return colors.primary;
      case 'ghost': return colors.primary;
      case 'secondary': return colors.text;
      default: return colors.surface;
    }
  }};
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px';
      case 'large': return '18px';
      default: return '16px';
    }
  }};
  font-weight: ${typography.weights.semibold};
  margin-left: ${props => props.hasIcon ? `${spacing.sm}px` : '0'};
`;

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon,
  borderRadius,
  style,
  textStyle,
  ...props
}) => {
  return (
    <StyledButton
      onPress={onPress}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      borderRadius={borderRadius}
      style={style}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.surface : colors.primary} 
          size="small"
        />
      ) : (
        <>
          {icon}
          <ButtonText 
            variant={variant}
            size={size}
            hasIcon={!!icon}
            style={textStyle}
          >
            {title}
          </ButtonText>
        </>
      )}
    </StyledButton>
  );
};

export default Button;