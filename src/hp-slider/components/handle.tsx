import * as React from 'react';
import * as _ from 'lodash'; 
import { common } from '../common';
import { calculations } from '../calculations';
import { EnumHandleType } from '../enums';
import { IDomain, IHpSliderHandleValues } from '../interfaces';
import { IHpSliderScss } from '../../sass/styles';

export interface IHpSliderHandleMoved {
  (newValue: number | number[], handle: EnumHandleType): void;
}

export interface IHpSliderHandlePressed {
  (pressed: boolean, handle: EnumHandleType): void;
}

export interface IHpSliderHandleProps {
  scss: IHpSliderScss;
  handleType: EnumHandleType;
  domain: IDomain<number>;
  /**
   * For EnumHandleType.Left or EnumHandleType.Right it just a value (in domain),
   * for EnumHandleType.Bar it is a two dimensional array describing 
   * value left, value right in domain.
   * 
   * TODO: migrate number[] to IHpSliderHandleValues
   */
  value: number | number[];
  onMoved?: IHpSliderHandleMoved;
  onPressed?: IHpSliderHandlePressed;
}

export interface IHpSliderHandleState {
  isPressed?: boolean;
  previousScreenX?: number | null;
}

export class HpSliderHandle extends React.Component<IHpSliderHandleProps, IHpSliderHandleState>{
  constructor(props) {
    super(props);
    this.state = {
      isPressed: false,
      previousScreenX: null
    };
  }

  public componentDidMount() {
    window.addEventListener('mouseup', this.globalMouseUp, false);
    window.addEventListener('mousemove', this.globalMouseMove, false);
  }

  public componentWillUnmount() {
    window.removeEventListener('mouseup', this.globalMouseUp);
    window.removeEventListener('mousemove', this.globalMouseMove);
  }

  getHandleStyle = (): React.CSSProperties => {
    let leftPx = 0;
    let widthPx = 0;
    switch (this.props.handleType) {
      case EnumHandleType.Left:
      case EnumHandleType.Right:
        let value = _.isNumber(this.props.value) ? this.props.value : 0; 
        leftPx = calculations.translateValueToHandleLeftPositionPx(this.props.domain, this.props.scss, this.props.handleType, value);
        widthPx = this.props.scss.handleWidthPx;
        break;
      case EnumHandleType.DragBar:
        leftPx = calculations.translateValueToHandleLeftPositionPx(this.props.domain, this.props.scss, this.props.handleType, this.props.value[0]) +
          this.props.scss.handleWidthPx;
        /**
         * Keep in mind:
         * - the left edge of left handle (of type EnumHandleType.Left) represents this.props.value[0] and 
         * - the right edge of right handle (of type EnumHandleType.Right) represents this.props.value[1].
         * So since we have additional handles to display (EnumHandleType.Left, EnumHandleType.Right), 
         * EnumHandleType.Bar cannot occupy the whole screen space that domainLengthSliderRepresents holds. 
         */
        let domainLengthSliderRepresents = (this.props.value[1] - this.props.value[0]);
        let domainLengthHandleRepresents = calculations.expressLengthPxInDomain(this.props.domain, this.props.scss, this.props.scss.handleWidthPx);
        widthPx = calculations.expressDomainLengthInPx(this.props.domain, this.props.scss, domainLengthSliderRepresents - 2*domainLengthHandleRepresents);
        break;
    }
    
    let result: React.CSSProperties = {
      left: leftPx,
      width: widthPx >= 1 ? widthPx : 1,
      position: "absolute",
      cursor: "pointer",
    };
    return result;
  }

  getClassName = ():string => {
    let result = ["hp-slider-handle"];
    if (this.state.isPressed)
      result.push("hp-slider-handle-pressed");
    switch (this.props.handleType) {
      case EnumHandleType.DragBar:
        result.push("hp-slider-handle-dragBar");
        break;
      case EnumHandleType.Left:
        result.push("hp-slider-handle-left");
        break;
      case EnumHandleType.Right:
        result.push("hp-slider-handle-right");
        break;
    }
    return _.join(result, " ");
  }

  globalMouseUp = (e): boolean => {
    this.setState({
      isPressed: false,
      previousScreenX: null
    });
    if (_.isFunction(this.props.onPressed))
      this.props.onPressed(false, this.props.handleType);
    return true;
  }

  globalMouseMove = (e): boolean => {
    if (this.state.isPressed) {
      //for a positive delta, handle bar was moved rightwards,
      //for a negative delta, handle was moved leftwards
      let deltaPx = e.screenX - this.state.previousScreenX;
      let deltaDomain = calculations.expressLengthPxInDomain(this.props.domain, this.props.scss, deltaPx);
      this.setState({ previousScreenX: e.screenX });
      if (_.isFunction(this.props.onMoved)) {
        switch (this.props.handleType) {
          case EnumHandleType.Left:
          case EnumHandleType.Right:
            let point = _.isNumber(this.props.value) ? this.props.value : 0;
            this.props.onMoved(point + deltaDomain, this.props.handleType);
            break;
          case EnumHandleType.DragBar:
            if (!_.isArray(this.props.value))
              return;
            let vector = [this.props.value[0] + deltaDomain, this.props.value[1] + deltaDomain];
            this.props.onMoved(vector, this.props.handleType);
            break;
        } 
      }
    }
    return common.pauseEvent(e);
  }

  render() {
    let self = this;
    return <div 
      className={this.getClassName()}
      style={this.getHandleStyle()}
      onMouseDown={(e) => {
        this.setState({ isPressed: true, previousScreenX: e.screenX });
        if (_.isFunction(this.props.onPressed))
          this.props.onPressed(true, this.props.handleType);
      }}>
    </div>
  }
}