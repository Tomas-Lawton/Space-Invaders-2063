export function mapValue(value, fromMin, fromMax, toMin, toMax) {
    if (value < fromMin) {
      value = fromMin;
    } else if (value > fromMax) {
      value = fromMax;
    }
    const percentage = (value - fromMin) / (fromMax - fromMin);
    const mappedValue = toMin + percentage * (toMax - toMin);
    return mappedValue;
  }