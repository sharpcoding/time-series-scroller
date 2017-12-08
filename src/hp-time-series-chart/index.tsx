import * as React from 'react';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { IHpTimeSeriesChartState } from './state';
import { hpTimeSeriesChartCalculations } from './calculations';
import { IChartDimensions, IEventChartConfiguration, IChartTimeSeries } from './interfaces';
import { IDateTimePoint } from './state/date-time-point';
import { IChartZoomSettings } from './state/chart-zoom-settings';
import { TimeSeries } from './components/time-series';
import { DateTimeAxis } from './components/date-time-axis';
import { ValueAxis } from './components/value-axis';
import { Events } from './components/events';

export interface IHpTimeSeriesChartProps {
  state: IHpTimeSeriesChartState;
  chartDimensions: IChartDimensions;
  /**
   * If set, chart will display events on the bottom of the screeen (in spectrogram chart)
   */
  eventChartConfiguration?: IEventChartConfiguration;
}

export const HpTimeSeriesChart = (props: IHpTimeSeriesChartProps) => {
  /**
   * Auxiliary functions 
   */  
  let getXScale = () => {
    return d3.scaleTime()
      .domain([props.state.windowDateFrom, props.state.windowDateTo])
      .range([props.chartDimensions.timeSeriesChartPaddingLeft, 
        props.chartDimensions.canvasWidth - props.chartDimensions.timeSeriesChartPaddingLeft - props.chartDimensions.timeSeriesChartPaddingRight]);
  };
  
  let getYScale = () => {
    return d3.scaleLinear()
      .domain([props.state.yMinValue, props.state.yMaxValue])
      .range([props.chartDimensions.canvasHeight - props.chartDimensions.timeSeriesChartPaddingTop - props.chartDimensions.timeSeriesChartPaddingBottom, 
        props.chartDimensions.timeSeriesChartPaddingTop]);
  };

  let chartTimeSeries: IChartTimeSeries[] = _.map(props.state.series, el => 
    hpTimeSeriesChartCalculations.getFilteredTimeSeries(el, 
      props.state.windowDateFrom, 
      props.state.windowDateTo,
      props.state.chartZoomSettings,
      props.chartDimensions.canvasWidth));

  let xScale = getXScale();
  let yScale = getYScale();

  return (
    <svg 
      width={props.chartDimensions.canvasWidth} 
      height={props.chartDimensions.canvasHeight}>
      <TimeSeries 
        xScale={xScale} 
        yScale={yScale}
        chartTimeSeries={chartTimeSeries}
        graphPointsSelectionMode={props.state.graphPointsSelectionMode} 
        chartDimensions={props.chartDimensions} 
      />
      <Events
        xScale={xScale} 
        data={[]}
        chartDimensions={props.chartDimensions}
        eventChartConfiguration={props.eventChartConfiguration} 
      />
      <DateTimeAxis xScale={xScale} chartDimensions={props.chartDimensions} />
      <ValueAxis yScale={yScale} chartDimensions={props.chartDimensions} />
    </svg>
  );
}