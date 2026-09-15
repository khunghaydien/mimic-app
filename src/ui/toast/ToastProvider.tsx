import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export const toast = {
  show: (_type: 'success' | 'error', _message: string) => {},
};

export class ToastProvider extends Component<
  { children: ReactNode },
  { type: 'success' | 'error'; message: string }
> {
  state = { type: 'error' as 'success' | 'error', message: '' };
  timer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    toast.show = (type, message) => {
      this.setState({ type, message });
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => this.setState({ message: '' }), 2800);
    };
  }

  componentWillUnmount() {
    toast.show = () => undefined;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  render() {
    const { type, message } = this.state;
    return (
      <>
        {this.props.children}
        {message ? (
          <Pressable
            onPress={() => this.setState({ message: '' })}
            style={[
              styles.toast,
              { backgroundColor: type === 'success' ? '#16A34A' : '#D64545' },
            ]}
          >
            <Text style={styles.text}>{message}</Text>
          </Pressable>
        ) : null}
      </>
    );
  }
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
