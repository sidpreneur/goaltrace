export function Button({ children, onClick }) {
  return (
    <button className="px-6 py-1 bg-[#9D7DE6] text-white font-semibold rounded-full shadow-md hover:bg-[#8F79BE] transition" onClick={onClick}>
      {children}
    </button>
  );
}
