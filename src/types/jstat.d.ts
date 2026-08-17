declare module 'jstat' {
  interface DistributionApi {
    cdf(value: number, parameter: number): number
    inv(probability: number, parameter: number): number
  }

  const jStat: {
    studentt: DistributionApi
    chisquare: DistributionApi
  }
  export default jStat
}
