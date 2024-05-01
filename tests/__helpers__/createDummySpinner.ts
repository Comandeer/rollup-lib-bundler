interface DummySpinner {
	show: () => Promise<void>;
	hide: () => Promise<void>;
}

export default function createDummySpinner(): DummySpinner {
	return {
		async show(): Promise<void> {},
		async hide(): Promise<void> {}
	};
}
