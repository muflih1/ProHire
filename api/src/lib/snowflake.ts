class Snowflake {
  private static _instance: Snowflake
  private _epoch: number
  private _shardId: number
  private _sequence: bigint
  private _lastTimestamp: number

  static getInstance() {
    if (!Snowflake._instance) {
      Snowflake._instance = new Snowflake()
    }
    return Snowflake._instance
  }

  constructor (shardId = 0, epoch = 1759909758646) {
    this._epoch = epoch
    this._shardId = shardId
    this._sequence = 0n
    this._lastTimestamp = -1
  }

  private _now() {
    return Date.now()
  }

  private _wait(lastTimestamp: number) {
    let timestamp = this._now()
    while (timestamp <= lastTimestamp) {
      timestamp = this._now()
    }
    return timestamp
  }

  nextId() {
    let timestamp = this._now()
    if (timestamp === this._lastTimestamp) {
      this._sequence = (this._sequence + 1n) & 4095n
      if (this._sequence === 0n) {
        timestamp = this._wait(this._lastTimestamp)
      }
    } else {
      this._sequence = 0n
    }
    this._lastTimestamp = timestamp
  
    const timestampPart = BigInt(timestamp - this._epoch) << 22n
    const shardPart = BigInt(this._shardId) << 12n
    const sequencePart = BigInt(this._sequence)
  
    return timestampPart | shardPart | sequencePart
  }
  
}

export const snowflake = Snowflake.getInstance()