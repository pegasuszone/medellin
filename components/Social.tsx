export interface ISocial {
  name: string
  href: string
  icon: string
}

const Social = ({ href, icon }: ISocial) => (
  <a href={href} rel="noopener noreferrer" target="_blank">
    <img
      src={icon}
      className="w-6 h-6 opacity-50 cursor-pointer hover:opacity-75"
    />
  </a>
)

export default Social
