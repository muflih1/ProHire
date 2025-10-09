type Alphabet = "a-z" | "A-Z" | "0-9" | "-_";

function expandAlphabet(alphabet: Alphabet): string {
	switch (alphabet) {
		case "a-z":
			return "abcdefghijklmnopqrstuvwxyz";
		case "A-Z":
			return "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		case "0-9":
			return "0123456789";
		case "-_":
			return "-_";
		default:
			throw new Error(`Unsupported alphabet: ${alphabet}`);
	}
}

export function createRandomStringGenerator<A extends Alphabet>(
	...baseAlphabets: A[]
) {
	const baseCharSet = baseAlphabets.map(expandAlphabet).join("");
	if (baseCharSet.length === 0) {
		throw new Error(
			"No valid characters provided for random string generation.",
		);
	}

	const baseCharSetLength = baseCharSet.length;

	return <SubA extends Alphabet>(length: number, ...alphabets: SubA[]) => {
		if (length <= 0) {
			throw new Error("Length must be a positive integer.");
		}

		let charSet = baseCharSet;
		let charSetLength = baseCharSetLength;

		if (alphabets.length > 0) {
			charSet = alphabets.map(expandAlphabet).join("");
			charSetLength = charSet.length;
		}

		const maxValid = Math.floor(256 / charSetLength) * charSetLength;
		const buf = new Uint8Array(length * 2);
		const bufLength = buf.length;

		let result = "";
		let bufIndex = bufLength;
		let rand: number;

		while (result.length < length) {
			if (bufIndex >= bufLength) {
				crypto.getRandomValues(buf);
				bufIndex = 0;
			}

			rand = buf[bufIndex++]!;

			// avoid modulo bias
			if (rand < maxValid) {
				result += charSet[rand % charSetLength];
			}
		}

		return result;
	};
}