export class Ip {
	private firstBit: number;
	private secondBit: number;
	private thirdBit: number;
	private fourthBit: number;

	private questionMark: boolean;

	public constructor(ip: string) {
		this.questionMark = ip === '?';
		const bitArray = ip.split('.');
		if (bitArray.length === 4) {
			this.firstBit = parseInt(bitArray[0]);
			this.secondBit = parseInt(bitArray[1]);
			this.thirdBit = parseInt(bitArray[2]);
			this.fourthBit = parseInt(bitArray[3]);
		}
	}

	public toString(): string {
		if (this.questionMark) return '?';
		return [
			this.firstBit.toString(),
			this.secondBit.toString(),
			this.thirdBit.toString(),
			this.fourthBit.toString(),
		].join('.');
	}

	public isQuestionMark(): boolean {
		return this.questionMark;
	}

	public getFirstBit(): number {
		return this.firstBit;
	}
	public getSecondBit(): number {
		return this.secondBit;
	}
	public getThirdBit(): number {
		return this.thirdBit;
	}
	public getFourthBit(): number {
		return this.fourthBit;
	}
}
