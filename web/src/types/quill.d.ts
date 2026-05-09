import 'quill'

declare module 'quill' {
  interface QuillStatic {
    register(modules: Record<string, any>, overwrite?: boolean): void
  }
}
