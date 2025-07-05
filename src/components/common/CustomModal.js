import { StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "@react-native-community/blur";
import Modal from "react-native-modal";
import React from "react";

const CustomModal = ({
  isVisible,
  transparent = true,
  onDisable,
  backdropOpacity,
  mainMargin,
  marginTop,
  marginBottom,
  marginVertical,
  marginHorizontal,
  borderRadius,
  overflow,
  children,
  isChange,
  animationIn,
  animationOut,
  swipeDirection,
  animationInTiming,
  animationOutTiming,
  isTop,
  isBlur = false,
  blurType = "dark",
  blurAmount = 15,
}) => {
  return (
    <Modal
      isVisible={isVisible}
      animationIn={animationIn || "fadeIn"}
      animationOut={animationOut || "fadeOut"}
      swipeDirection={swipeDirection}
      transparent={transparent}
      onBackdropPress={onDisable}
      onBackButtonPress={onDisable}
      animationInTiming={animationInTiming}
      onDismiss={onDisable}
      backdropOpacity={isBlur ? 0 : backdropOpacity}
      animationOutTiming={animationOutTiming}
      style={[
        {
          margin: mainMargin,
          marginTop,
          marginBottom,
          marginVertical,
          marginHorizontal,
          borderRadius,
          overflow,
        },
      ]}
    >
      {isBlur && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={blurType}
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor="white"
        />
      )}

      <TouchableOpacity
        style={
          isChange
            ? styles.mainContainer1
            : isTop
            ? styles.mainContainer2
            : styles.mainContainer
        }
        activeOpacity={1}
        onPress={onDisable}
      >
        <TouchableOpacity style={styles.container} activeOpacity={1}>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer1: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  mainContainer2: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  container: {
    width: "100%",
  },
});
