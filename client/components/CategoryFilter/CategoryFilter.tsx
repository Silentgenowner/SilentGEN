type Props = {
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
};

const categories = [
  "All",
  "Clothing",
  "Shoes",
  "Watches",
  "Bags",
];

export default function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`px-5 py-2 rounded-lg border transition ${
            selectedCategory === category
              ? "bg-blue-600 text-white"
              : "bg-white"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
