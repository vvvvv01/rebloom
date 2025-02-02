import BaseFilter from './base-filter'
import { InsertOptions, StringOrNumber } from './options'

/**
 * Bloom filter
 */
export default class BloomFilter extends BaseFilter {
  /**
   * Reserve space for the filter
   * @param errorRate The desired probability for false positives
   * @param capacity The number of entries intended to be added to the filter
   * @param expansionRate Expansion rate. If expansionRate <= 0, the filter is non-scalable.
   * @return OK on success, error otherwise
   */
  public reserve(
    errorRate: number,
    capacity: number,
    expansionRate = 2
  ): Promise<string> {
    let cmd
    if (expansionRate <= 0) {
      cmd = ['BF.RESERVE', this.name, errorRate, capacity, 'NONSCALING']
    } else {
      cmd = ['BF.RESERVE', this.name, errorRate, capacity, 'EXPANSION', expansionRate]
    }
    return this.client.callOne(cmd)
  }

  /**
   * Add an item to the filter
   * @param item Item
   * @return 1 if item was newly added, 0 if it may have already existed
   */
  public add(item: any): Promise<number> {
    return this.client.call('BF.ADD', this.name, item)
  }

  /**
   * Add items to the filter
   * @param items Array of items
   * @return Array of integers, each is either 1 or 0 depending on whether the corresponding item was newly added or may have already existed
   */
  public madd(items: any[]): Promise<number[]> {
    return this.client.call('BF.MADD', this.name, ...items)
  }

  /**
   * Check whether an item may already exist in the filter
   * @param item Item
   * @return 1 if item may exist, 0 if item certainly does not exist
   */
  public exists(item: any): Promise<number> {
    return this.client.call('BF.EXISTS', this.name, item)
  }

  /**
   * Check whether items may already exist in the filter
   * @param items Array of items
   * @return Array of integers, each is either 1 or 0 depending on whether the corresponding item may exist or certainly does not exist
   */
  public mexists(items: any[]): Promise<number[]> {
    return this.client.call('BF.MEXISTS', this.name, ...items)
  }

  /**
   * Get filter info
   * @return Array of string
   */
  public info(): Promise<string[]> {
    return this.client.call('BF.INFO', this.name)
  }

  /**
   * BF.INSERT is a sugarcoated combination of BF.RESERVE and BF.ADD.
   * It creates a new filter if the key does not exist using the relevant arguments (see BF.RESERVE).
   * Next, all ITEMS are inserted.
   * @param items Array of items
   * @param options InsertOptions
   * @return Array of integers, each is either 1 or 0 depending on whether the corresponding item was newly added or may have already existed
   */
  public insert(
    items: any[],
    { errorRate, capacity, expansionRate, upsert = true }: InsertOptions = {}
  ): Promise<number[]> {
    const cmd: StringOrNumber[] = ['BF.INSERT', this.name]
    if (errorRate) cmd.push('ERROR', errorRate)

    if (capacity) cmd.push('CAPACITY', capacity)

    if (expansionRate)
      if (expansionRate < 0) cmd.push('NONSCALING')
      else cmd.push('EXPANSION', expansionRate)

    if (!upsert) cmd.push('NOCREATE')

    cmd.push('ITEMS', ...items)
    return this.client.call(...cmd)
  }
}
