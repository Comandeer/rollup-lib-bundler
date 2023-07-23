interface DummySpinner {
	show: () => void;
	hide: () => void;
}

export default function createDummySpinner(): DummySpinner {
	return {
		show(): void {},
		hide(): void {}
	};
}
