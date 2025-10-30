// Suppress AbortError in development
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('AbortError')) {
      return;
    }
    originalError(...args);
  };
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Font from 'expo-font';
import * as Haptics from 'expo-haptics';
import { AlertCircle, Bot, Check, Copy, ExternalLink, File, Info, Menu, MessageSquare, Paperclip, Plus, Send, Settings, Sparkles, StopCircle, Trash2, X } from 'lucide-react-native';
import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  ListRenderItem,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GEMINI_API_KEY } from '../env';

// --- Type Definitions ---
interface FloatingOrbProps {
  size: number;
  delay: number;
  isGenerating?: boolean;
}
interface AnimatedDotProps {
  delay: number;
}
type Sender = 'user' | 'bot';

interface AttachedFile {
  name: string;
  mimeType: string;
  size: number;
  uri: string;
}

interface MessageType {
  id: string;
  text: string;
  sender: Sender;
  isLoading?: boolean;
  timestamp: number;
  attachedFile?: AttachedFile;
}

interface ConversationType {
  id: string;
  title: string;
  messages: MessageType[];
  createdAt: number;
  updatedAt: number;
}

// --- Constants ---
const screen = Dimensions.get('window');
const CONVERSATIONS_KEY = 'GIGI_CONVERSATIONS';
const CURRENT_CONVERSATION_KEY = 'GIGI_CURRENT_CONVERSATION';
const USER_API_KEY = 'GIGI_USER_API_KEY';
const FIRST_LAUNCH_KEY = 'GIGI_FIRST_LAUNCH';
const MAX_CONVERSATIONS = 50;
const SIDEBAR_WIDTH = 280;

// --- Welcome Setup Modal ---
const WelcomeSetupModal = ({
  visible,
  onGetStarted,
}: {
  visible: boolean;
  onGetStarted: () => void;
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    statusBarTranslucent
  >
    <View style={styles.modalOverlay}>
      <View style={styles.welcomeModalContent}>
        <View style={styles.welcomeHeader}>
          <Sparkles size={48} color="#4a4af5" />
          <Text style={styles.welcomeTitle}>Welcome to GIGI!</Text>
        </View>

        <View style={styles.welcomeBody}>
          <Text style={styles.welcomeText}>
            Your intelligent AI assistant powered by Google's Gemini.
          </Text>

          <View style={styles.setupSteps}>
            <View style={styles.setupStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get your API Key</Text>
                <Text style={styles.stepDescription}>
                  Visit Google AI Studio to get your free API key
                </Text>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
                >
                  <ExternalLink size={14} color="#4a9eff" />
                  <Text style={styles.linkButtonText}>aistudio.google.com</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.setupStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Add to Settings</Text>
                <Text style={styles.stepDescription}>
                  Open Settings from the sidebar menu and paste your API key
                </Text>
              </View>
            </View>

            <View style={styles.setupStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Start Chatting!</Text>
                <Text style={styles.stepDescription}>
                  Ask anything and enjoy your AI-powered conversations
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Info size={16} color="#C0C0FF" />
            <Text style={styles.infoText}>
              Your API key is stored locally on your device and never shared
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={onGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- Enhanced Markdown Components ---
const CodeBlock = ({ code, language }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.mdCodeBlock}>
      <View style={styles.codeBlockHeader}>
        {language && <Text style={styles.codeLanguage}>{language}</Text>}
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} color="#C0C0FF" />}
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.mdCode}>{code}</Text>
      </ScrollView>
    </View>
  );
};

const ClickableLink = ({ url, children }: { url: string; children: string }) => {
  const handlePress = () => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open URL:', url);
    });
  };

  return (
    <Text style={styles.mdLink} onPress={handlePress}>
      {children} <ExternalLink size={12} color="#4a9eff" />
    </Text>
  );
};

// --- File Attachment Preview Component ---
const FileAttachmentPreview = ({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) => (
  <View style={styles.fileAttachmentPreview}>
    <View style={styles.fileAttachmentInfo}>
      <File size={16} color="#C0C0FF" />
      <Text style={styles.fileAttachmentName} numberOfLines={1}>{file.name}</Text>
      <Text style={styles.fileAttachmentSize}>
        {(file.size / 1024).toFixed(1)} KB
      </Text>
    </View>
    <TouchableOpacity onPress={onRemove} style={styles.fileAttachmentRemove}>
      <X size={16} color="#ff6b6b" />
    </TouchableOpacity>
  </View>
);

// --- Themed Modal Component ---
const ThemedModal = ({ 
  visible, 
  title, 
  message,
  options, 
  onClose 
}: { 
  visible: boolean; 
  title: string;
  message?: string;
  options: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>; 
  onClose: () => void;
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.modalTitle}>{title}</Text>
        {message && <Text style={styles.modalMessage}>{message}</Text>}
        <View style={styles.modalOptions}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.modalOption,
                option.style === 'destructive' && styles.modalOptionDestructive,
                option.style === 'cancel' && styles.modalOptionCancel,
              ]}
              onPress={() => {
                option.onPress();
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  option.style === 'destructive' && styles.modalOptionTextDestructive,
                  option.style === 'cancel' && styles.modalOptionTextCancel,
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// --- Settings Modal Component ---
const SettingsModal = ({
  visible,
  currentApiKey,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentApiKey: string;
  onSave: (apiKey: string) => void;
  onClose: () => void;
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (visible) {
      setApiKey(currentApiKey);
    }
  }, [visible, currentApiKey]);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.settingsModalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.settingsHeader}>
            <Settings size={24} color="#C0C0FF" />
            <Text style={styles.modalTitle}>Settings</Text>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsLabel}>Gemini API Key</Text>
            <Text style={styles.settingsHint}>
              Get your free API key from Google AI Studio
            </Text>
            <TouchableOpacity
              style={styles.getApiKeyButton}
              onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
            >
              <ExternalLink size={16} color="#4a9eff" />
              <Text style={styles.getApiKeyText}>Get API Key</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.settingsInput}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Paste your API key here..."
              placeholderTextColor="#6a6a8b"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowKey(!showKey)}
              style={styles.showKeyButton}
            >
              <Text style={styles.showKeyText}>
                {showKey ? 'Hide' : 'Show'} API Key
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.settingsButton, styles.settingsCancelButton]}
            >
              <Text style={styles.settingsCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.settingsButton, styles.settingsSaveButton]}
              disabled={!apiKey.trim()}
            >
              <Text style={styles.settingsSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- Conversation Sidebar Component ---
const ConversationSidebar = ({
  visible,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
  onClose,
}: {
  visible: boolean;
  conversations: ConversationType[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) => {
  const translateX = useSharedValue(-SIDEBAR_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(
      visible ? 0 : -SIDEBAR_WIDTH,
      {
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }
    );
  }, [visible]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.sidebarOverlay}>
        <Pressable style={styles.sidebarBackdrop} onPress={onClose} />
        <Animated.View style={[styles.sidebarContent, animatedSidebarStyle]}>
          <View style={styles.sidebarHeader}>
            <TouchableOpacity onPress={onClose} style={styles.sidebarCloseButton}>
              <X size={20} color="#C0C0FF" />
            </TouchableOpacity>
            <Text style={styles.sidebarTitle}>Conversations</Text>
          </View>

          <TouchableOpacity style={styles.newConversationButton} onPress={onNewConversation}>
            <Plus size={20} color="#FFF" />
            <Text style={styles.newConversationText}>New Chat</Text>
          </TouchableOpacity>

          <ScrollView style={styles.conversationList} showsVerticalScrollIndicator={false}>
            {conversations.length === 0 ? (
              <View style={styles.emptyConversations}>
                <Text style={styles.emptyConversationsText}>No conversations yet</Text>
              </View>
            ) : (
              conversations.map((conv) => (
                <View key={conv.id} style={styles.conversationItemWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.conversationItem,
                      conv.id === currentConversationId && styles.conversationItemActive,
                    ]}
                    onPress={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                  >
                    <MessageSquare 
                      size={18} 
                      color={conv.id === currentConversationId ? "#FFF" : "#C0C0FF"} 
                    />
                    <View style={styles.conversationItemText}>
                      <Text
                        style={[
                          styles.conversationItemTitle,
                          conv.id === currentConversationId && styles.conversationItemTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {conv.title}
                      </Text>
                      <Text style={styles.conversationItemDate}>
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteConversationButton}
                    onPress={() => onDeleteConversation(conv.id)}
                  >
                    <Trash2 size={16} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.settingsButtonSidebar} onPress={onOpenSettings}>
            <Settings size={20} color="#C0C0FF" />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// --- Enhanced Markdown Renderer Component ---
const MarkdownText = ({ children }: { children: string }) => {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let codeBlockStartIndex = -1;
    let inBlockquote = false;
    let blockquoteContent: string[] = [];

    lines.forEach((line, index) => {
      // Code block handling
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockStartIndex = index;
          codeBlockLanguage = line.trim().replace('```', '').trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          if (codeBlockContent.length > 0) {
            elements.push(
              <CodeBlock 
                key={`code-block-${codeBlockStartIndex}`}
                code={codeBlockContent.join('\n')}
                language={codeBlockLanguage}
              />
            );
          }
          codeBlockContent = [];
          codeBlockLanguage = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Blockquote handling
      if (line.trim().startsWith('>')) {
        if (!inBlockquote) {
          inBlockquote = true;
          blockquoteContent = [];
        }
        blockquoteContent.push(line.replace(/^>\s*/, ''));
        return;
      } else if (inBlockquote) {
        inBlockquote = false;
        elements.push(
          <View key={`blockquote-${index}`} style={styles.mdBlockquote}>
            {blockquoteContent.map((bqLine, i) => (
              <Text key={i} style={styles.mdBlockquoteText}>{bqLine}</Text>
            ))}
          </View>
        );
        blockquoteContent = [];
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <Text key={`h3-${index}`} style={styles.mdH3}>
            {line.replace('### ', '')}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={`h2-${index}`} style={styles.mdH2}>
            {line.replace('## ', '')}
          </Text>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <Text key={`h1-${index}`} style={styles.mdH1}>
            {line.replace('# ', '')}
          </Text>
        );
      }
      // Lists
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <Text key={`list-${index}`} style={styles.mdListItem}>
            • {line.replace(/^[\s]*[-*]\s/, '')}
          </Text>
        );
      }
      else if (/^\d+\.\s/.test(line.trim())) {
        elements.push(
          <Text key={`num-list-${index}`} style={styles.mdListItem}>
            {line.trim()}
          </Text>
        );
      }
      // Regular text
      else if (line.trim().length > 0) {
        const styledText = renderInlineMarkdown(line, index);
        elements.push(
          <Text key={`text-${index}`} style={styles.mdParagraph}>
            {styledText}
          </Text>
        );
      }
      else {
        elements.push(<View key={`space-${index}`} style={{ height: 8 }} />);
      }
    });

    // Handle unclosed blocks
    if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <CodeBlock 
          key={`code-block-unclosed`}
          code={codeBlockContent.join('\n')}
          language={codeBlockLanguage}
        />
      );
    }

    if (inBlockquote && blockquoteContent.length > 0) {
      elements.push(
        <View key={`blockquote-unclosed`} style={styles.mdBlockquote}>
          {blockquoteContent.map((bqLine, i) => (
            <Text key={i} style={styles.mdBlockquoteText}>{bqLine}</Text>
          ))}
        </View>
      );
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string, lineIndex: number) => {
  const parts: JSX.Element[] = [];
  let i = 0;
  let keyCounter = 0;

  while (i < text.length) {
    // Check for **bold**
    if (text.substring(i, i + 2) === '**') {
      const endIndex = text.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const content = text.substring(i + 2, endIndex);
        parts.push(
          <Text key={`${lineIndex}-b-${keyCounter++}`} style={styles.mdBold}>
            {content}
          </Text>
        );
        i = endIndex + 2;
        continue;
      }
    }

    // Check for `code`
    if (text[i] === '`') {
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const content = text.substring(i + 1, endIndex);
        parts.push(
          <Text key={`${lineIndex}-c-${keyCounter++}`} style={styles.mdInlineCode}>
            {content}
          </Text>
        );
        i = endIndex + 1;
        continue;
      }
    }

    // Check for [link](url)
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          const linkText = text.substring(i + 1, closeBracket);
          const url = text.substring(closeBracket + 2, closeParen);
          parts.push(
            <ClickableLink key={`${lineIndex}-l-${keyCounter++}`} url={url}>
              {linkText}
            </ClickableLink>
          );
          i = closeParen + 1;
          continue;
        }
      }
    }

    // Find next special character
    const nextSpecial = text.substring(i).search(/[\*`\[]/);
    if (nextSpecial === -1) {
      // No more special chars, add rest of text
      parts.push(<Text key={`${lineIndex}-t-${keyCounter++}`}>{text.substring(i)}</Text>);
      break;
    } else if (nextSpecial > 0) {
      // Add plain text before next special char
      parts.push(
        <Text key={`${lineIndex}-t-${keyCounter++}`}>
          {text.substring(i, i + nextSpecial)}
        </Text>
      );
      i += nextSpecial;
    } else {
      // Special char not matched, treat as plain text
      parts.push(<Text key={`${lineIndex}-t-${keyCounter++}`}>{text[i]}</Text>);
      i++;
    }
  }

  return parts.length > 0 ? parts : [<Text key={`${lineIndex}-t-0`}>{text}</Text>];
};

  return <View>{parseMarkdown(children)}</View>;
};

// --- Morphing Orb Component ---
const MorphingOrb = ({ size, delay, isGenerating = false }: FloatingOrbProps) => {
  const x = useSharedValue(Math.random() * screen.width);
  const y = useSharedValue(Math.random() * screen.height);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const borderRadius = useSharedValue(size / 2);

  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      const duration = 15000 + Math.random() * 10000;
      x.value = withRepeat(withTiming(Math.random() * screen.width, { duration }), -1, true);
      y.value = withRepeat(withTiming(Math.random() * screen.height, { duration }), -1, true);
    }, delay);

    return () => {
      clearTimeout(animationTimeout);
      cancelAnimation(x);
      cancelAnimation(y);
    };
  }, []);

  useEffect(() => {
    if (isGenerating) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1);
      borderRadius.value = withRepeat(
        withSequence(
          withTiming(size / 2, { duration: 1000 }),
          withTiming(size / 4, { duration: 1000 }),
          withTiming(size / 6, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1);
      rotation.value = withTiming(0, { duration: 500 });
      borderRadius.value = withTiming(size / 2, { duration: 500 });
    }
  }, [isGenerating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    borderRadius: borderRadius.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingOrb,
        {
          width: size,
          height: size,
          backgroundColor: isGenerating
            ? 'rgba(138, 76, 255, 0.25)'
            : 'rgba(76, 76, 255, 0.15)',
        },
        animatedStyle,
      ]}
    />
  );
};

// --- Typing Indicator Component ---
const AnimatedDot = ({ delay }: AnimatedDotProps) => {
  const opacity = useSharedValue(0.5);
  const y = useSharedValue(0);

  useEffect(() => {
    const animation = withRepeat(
      withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })),
      -1
    );
    opacity.value = withDelay(delay, animation);
    y.value = withDelay(delay, animation);
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(y);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(y.value, [0, 1], [0, -6]) }],
  }));

  return <Animated.View style={[styles.typingDot, animatedStyle]} />;
};

const TypingIndicator = () => (
  <View style={styles.typingContainer}>
    <AnimatedDot delay={0} />
    <AnimatedDot delay={200} />
    <AnimatedDot delay={400} />
  </View>
);

// --- Error Message Component ---
const ErrorMessage = ({ message }: { message: string }) => (
  <View style={styles.errorContainer}>
    <AlertCircle size={16} color="#ff6b6b" />
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

// --- Main App Component ---
const GigiChatbotScreen = () => {
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>(GEMINI_API_KEY || '');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const flatListRef = useRef<FlatList<MessageType>>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Orbitron-Black': require('../assets/fonts/Orbitron-Black.ttf'),
          'PressStart2P-Regular': require('../assets/fonts/PressStart2P-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.error('Failed to load fonts', e);
        setFontsLoaded(true); // Continue anyway
      }
    }
    loadFonts();
  }, []);

  // Load API key and conversations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if first launch
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        
        // Load API key
        const savedApiKey = await AsyncStorage.getItem(USER_API_KEY);
        if (savedApiKey) {
          setUserApiKey(savedApiKey);
        } else if (!GEMINI_API_KEY) {
          // No API key at all - show welcome
          if (!hasLaunched) {
            setWelcomeVisible(true);
            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
          }
        }

        // Load conversations
        const savedConversations = await AsyncStorage.getItem(CONVERSATIONS_KEY);
        const savedCurrentId = await AsyncStorage.getItem(CURRENT_CONVERSATION_KEY);
        
        if (savedConversations) {
          const parsed = JSON.parse(savedConversations);
          setConversations(parsed);
          setCurrentConversationId(savedCurrentId || parsed[0]?.id || '');
        } else {
          const initialConv: ConversationType = {
            id: `conv-${Date.now()}`,
            title: 'New Conversation',
            messages: [{
              id: `msg-${Date.now()}`,
              text: "Hello! I'm Gigi, your AI assistant. How can I help you today?",
              sender: 'bot',
              timestamp: Date.now(),
            }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setConversations([initialConv]);
          setCurrentConversationId(initialConv.id);
        }
      } catch (e) {
        console.error('Failed to load data', e);
        setError('Failed to load chat history');
      } finally {
        setIsHistoryLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isHistoryLoaded && conversations.length > 0) {
      const conversationsToSave = conversations.slice(0, MAX_CONVERSATIONS);
      AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversationsToSave)).catch((e) =>
        console.error('Failed to save conversations', e)
      );
    }
  }, [conversations, isHistoryLoaded]);

  useEffect(() => {
    if (isHistoryLoaded && currentConversationId) {
      AsyncStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId).catch((e) =>
        console.error('Failed to save current conversation ID', e)
      );
    }
  }, [currentConversationId, isHistoryLoaded]);

  const handleSaveApiKey = async (apiKey: string) => {
    try {
      await AsyncStorage.setItem(USER_API_KEY, apiKey);
      setUserApiKey(apiKey);
    } catch (e) {
      console.error('Failed to save API key', e);
      setError('Failed to save API key');
    }
  };

  const handleWelcomeComplete = () => {
    setWelcomeVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setSidebarVisible(true);
      setTimeout(() => {
        setSidebarVisible(false);
        setSettingsVisible(true);
      }, 1500);
    }, 300);
  };

  const getCurrentConversation = () => 
    conversations.find(c => c.id === currentConversationId);

  const updateConversation = useCallback((updater: (conv: ConversationType) => ConversationType) => {
    setConversations(prev => 
      prev.map(c => c.id === currentConversationId ? updater(c) : c)
    );
  }, [currentConversationId]);

  // Handle stop generation
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSending(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Remove the loading message completely
      updateConversation(conv => ({
        ...conv,
        messages: conv.messages.filter(msg => !msg.isLoading),
        updatedAt: Date.now(),
      }));
    }
  }, [updateConversation]);

  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Check file size (limit to 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setAttachedFile({
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
        uri: file.uri,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error picking file:', error);
      setError('Failed to pick file');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newConv: ConversationType = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [{
        id: `msg-${Date.now()}`,
        text: "Hello! I'm Gigi, your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setSidebarVisible(false);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalConfig({
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation?',
      options: [
        {
          text: 'Delete',
          style: 'destructive' as const,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setConversations(prev => {
              const filtered = prev.filter(c => c.id !== id);
              
              if (id === currentConversationId) {
                if (filtered.length > 0) {
                  setCurrentConversationId(filtered[0].id);
                } else {
                  const newConv: ConversationType = {
                    id: `conv-${Date.now()}`,
                    title: 'New Conversation',
                    messages: [{
                      id: `msg-${Date.now()}`,
                      text: "Hello! I'm Gigi, your AI assistant. How can I help you today?",
                      sender: 'bot',
                      timestamp: Date.now(),
                    }],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  setCurrentConversationId(newConv.id);
                  return [newConv];
                }
              }
              
              return filtered.length > 0 ? filtered : [{
                id: `conv-${Date.now()}`,
                title: 'New Conversation',
                messages: [{
                  id: `msg-${Date.now()}`,
                  text: "Hello! I'm Gigi, your AI assistant. How can I help you today?",
                  sender: 'bot',
                  timestamp: Date.now(),
                }],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }];
            });
          },
        },
        { text: 'Cancel', style: 'cancel' as const, onPress: () => {} },
      ],
    });
    setModalVisible(true);
  }, [currentConversationId]);

  const handleClearChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalConfig({
      title: 'Clear Chat History',
      message: 'Are you sure you want to delete all messages in this conversation?',
      options: [
        {
          text: 'Clear',
          style: 'destructive' as const,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateConversation(conv => ({
              ...conv,
              messages: [{
                id: `msg-${Date.now()}`,
                text: "Chat cleared! How can I help you?",
                sender: 'bot',
                timestamp: Date.now(),
              }],
              title: 'New Conversation',
              updatedAt: Date.now(),
            }));
          },
        },
        { text: 'Cancel', style: 'cancel' as const, onPress: () => {} },
      ],
    });
    setModalVisible(true);
  }, [updateConversation]);

  const handleCopyMessage = useCallback((text: string) => {
    Clipboard.setString(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleShareMessage = useCallback(async (text: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error('Error sharing message:', error);
    }
  }, []);

  const handleLongPressMessage = useCallback((message: MessageType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalConfig({
      title: 'Message Options',
      message: 'What would you like to do?',
      options: [
        {
          text: 'Copy',
          onPress: () => handleCopyMessage(message.text),
        },
        {
          text: 'Share',
          onPress: () => handleShareMessage(message.text),
        },
        {
          text: 'Cancel',
          style: 'cancel' as const,
          onPress: () => {},
        },
      ],
    });
    setModalVisible(true);
  }, [handleCopyMessage, handleShareMessage]);

  const handleSend = useCallback(async () => {
    if (input.trim().length === 0 || isSending) return;

    // Check if API key is set
    if (!userApiKey) {
      setError('Please set your API key in Settings');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSettingsVisible(true);
      return;
    }

    const trimmedInput = input.trim();
    setError(null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: MessageType = {
      id: `msg-${Date.now()}`,
      text: trimmedInput,
      sender: 'user',
      timestamp: Date.now(),
      attachedFile: attachedFile || undefined,
    };
    const loadingMessageId = `msg-${Date.now() + 1}`;
    const loadingMessage: MessageType = {
      id: loadingMessageId,
      text: '',
      sender: 'bot',
      isLoading: true,
      timestamp: Date.now(),
    };

    updateConversation(conv => {
      const isFirstUserMessage = conv.messages.filter(m => m.sender === 'user').length === 0;
      return {
        ...conv,
        messages: [...conv.messages, userMessage, loadingMessage],
        title: isFirstUserMessage ? (trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? '...' : '')) : conv.title,
        updatedAt: Date.now(),
      };
    });

    setInput('');
    const currentAttachedFile = attachedFile;
    setAttachedFile(null);
    setIsSending(true);

    const currentConv = getCurrentConversation();
    const conversationHistory = (currentConv?.messages || [])
      .filter((m) => !m.isLoading && (m.sender !== 'bot' || (m.sender === 'bot' && m.text)))
      .slice(-20)
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    let userParts: any[] = [{ text: trimmedInput }];
    
    // Handle file attachment with base64 encoding
    if (currentAttachedFile) {
      try {
        const base64 = await FileSystem.readAsStringAsync(currentAttachedFile.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (currentAttachedFile.mimeType.startsWith('image/')) {
          userParts = [
            { text: trimmedInput },
            {
              inline_data: {
                mime_type: currentAttachedFile.mimeType,
                data: base64,
              },
            },
          ];
        } else if (currentAttachedFile.mimeType.startsWith('text/') || 
                   currentAttachedFile.mimeType === 'application/pdf') {
          try {
            const fileContent = await FileSystem.readAsStringAsync(currentAttachedFile.uri);
            userParts = [
              { 
                text: `File: ${currentAttachedFile.name}\n\nContent:\n${fileContent}\n\nUser query: ${trimmedInput}` 
              }
            ];
          } catch (textError) {
            userParts = [
              { text: `Analyzing file: ${currentAttachedFile.name}\n\n${trimmedInput}` },
              {
                inline_data: {
                  mime_type: currentAttachedFile.mimeType,
                  data: base64,
                },
              },
            ];
          }
        } else {
          userParts = [
            { text: `Analyzing file: ${currentAttachedFile.name}\n\n${trimmedInput}` },
            {
              inline_data: {
                mime_type: currentAttachedFile.mimeType,
                data: base64,
              },
            },
          ];
        }
      } catch (error) {
        console.error('Error reading file:', error);
        setError('Failed to read file');
        userParts = [{ text: `[Could not read file: ${currentAttachedFile.name}]\n\n${trimmedInput}` }];
      }
    }

    const payload = {
      contents: [...conversationHistory, { role: 'user', parts: userParts }],
      tools: [{
        "google_search": {}
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        candidateCount: 1,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ],
      systemInstruction: {
        parts: [{
          text: "You are Gigi, a helpful and concise AI assistant. Provide clear, accurate, and well-formatted responses. Keep answers focused and to the point unless specifically asked for detailed explanations. Use markdown formatting when appropriate: **bold** for emphasis, `code` for inline code, ```language for code blocks, and bullet points for lists."
        }]
      }
    };

    abortControllerRef.current = new AbortController();

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${userApiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorText = `API Error: ${response.status}`;
        try {
          const errorBody = await response.json();
          errorText = errorBody.error?.message || errorText;
        } catch (e) {
          errorText = `${errorText} - Could not parse error response.`;
        }
        throw new Error(errorText);
      }

      const result = await response.json();
      const botResponse =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't process that request.";

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      updateConversation(conv => ({
        ...conv,
        messages: conv.messages.map(msg =>
          msg.id === loadingMessageId
            ? { ...msg, text: '', isLoading: false }
            : msg
        ),
        updatedAt: Date.now(),
      }));

      const words = botResponse.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 40));
        
        currentText += (currentText ? ' ' : '') + words[i];
        
        if (i === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        updateConversation(conv => ({
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === loadingMessageId
              ? { ...msg, text: currentText, isLoading: false }
              : msg
          ),
          updatedAt: Date.now(),
        }));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error: any) {
      if (error.name === 'AbortError') {
    return; // Exit silently, no processing
  }
      console.error('Gemini API Error:', error);
      
      // Only show error if it's NOT an abort
      if (error.name !== 'AbortError') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        const errorMsg = error.message || 'An unknown error occurred';

        updateConversation(conv => ({
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === loadingMessageId
              ? { ...msg, text: `Error: ${errorMsg}`, isLoading: false }
              : msg
          ),
          updatedAt: Date.now(),
        }));
        setError(errorMsg);
      }
      // If it's an abort, do nothing - message already removed by handleStopGeneration
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [input, isSending, currentConversationId, conversations, attachedFile, userApiKey, updateConversation]);

  const renderMessage: ListRenderItem<MessageType> = useCallback(({ item }) => {
    return (
      <Pressable
        onLongPress={() => !item.isLoading && handleLongPressMessage(item)}
        delayLongPress={500}
      >
        <View
          style={[
            styles.messageRow,
            { justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start' },
          ]}
        >
          {item.sender === 'bot' && (
            <View style={styles.avatar}>
              <Bot size={20} color="#C0C0FF" />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              item.sender === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            {item.attachedFile && (
              <View style={styles.messageFileAttachment}>
                <File size={14} color={item.sender === 'user' ? "#FFF" : "#C0C0FF"} />
                <Text style={[
                  styles.messageFileName,
                  { color: item.sender === 'user' ? "#FFF" : "#C0C0FF" }
                ]} numberOfLines={1}>
                  {item.attachedFile.name}
                </Text>
              </View>
            )}
            {item.isLoading ? (
              <TypingIndicator />
            ) : item.sender === 'bot' ? (
              <MarkdownText>{item.text}</MarkdownText>
            ) : (
              <Text style={styles.messageText}>{item.text}</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  }, [handleLongPressMessage]);

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.backgroundOrbs}>
        <MorphingOrb size={150} delay={0} isGenerating={isSending} />
        <MorphingOrb size={100} delay={5000} isGenerating={isSending} />
        <MorphingOrb size={80} delay={10000} isGenerating={isSending} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSidebarVisible(true);
            }} 
            style={styles.menuButton}
          >
            <Menu size={22} color="#C0C0FF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Sparkles size={20} color="#C0C0FF" />
            <Text style={styles.headerTitle}>G I G I</Text>
          </View>

          <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
            <Trash2 size={20} color="#C0C0FF" />
          </TouchableOpacity>
        </View>

        {error && <ErrorMessage message={error} />}

        {!isHistoryLoaded ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C0C0FF" />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
          />
        )}

        {attachedFile && (
          <FileAttachmentPreview 
            file={attachedFile} 
            onRemove={() => {
              setAttachedFile(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }} 
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            onPress={handleFileUpload} 
            style={styles.attachButton}
            disabled={isSending}
          >
            <Paperclip size={22} color={isSending ? "#6a6a8b" : "#C0C0FF"} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Gigi anything..."
            placeholderTextColor="#6a6a8b"
            editable={!isSending}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={isSending ? handleStopGeneration : handleSend}
            style={[styles.sendButton, isSending && styles.stopButton]}
            disabled={!isSending && input.trim().length === 0}
          >
            {isSending ? (
              <StopCircle size={22} color="#FFF" />
            ) : (
              <Send size={22} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <WelcomeSetupModal
        visible={welcomeVisible}
        onGetStarted={handleWelcomeComplete}
      />

      <ConversationSidebar
        visible={sidebarVisible}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCurrentConversationId(id);
        }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => {
          setSidebarVisible(false);
          setTimeout(() => setSettingsVisible(true), 300);
        }}
        onClose={() => setSidebarVisible(false)}
      />

      <SettingsModal
        visible={settingsVisible}
        currentApiKey={userApiKey}
        onSave={handleSaveApiKey}
        onClose={() => setSettingsVisible(false)}
      />

      {modalConfig && (
        <ThemedModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          options={modalConfig.options}
          onClose={() => setModalVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

// --- Markdown Styles ---
const markdownStyles = {
  mdH1: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginVertical: 8,
  },
  mdH2: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginVertical: 6,
  },
  mdH3: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginVertical: 4,
  },
  mdParagraph: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    marginVertical: 2,
  },
  mdBold: {
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  mdItalic: {
    fontStyle: 'italic' as const,
    color: '#C0C0FF',
  },
  mdInlineCode: {
    backgroundColor: '#1e1e3f',
    color: '#C0C0FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mdCodeBlock: {
    backgroundColor: '#1e1e3f',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4a4af5',
  },
  mdCode: {
    color: '#C0C0FF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  mdListItem: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    marginVertical: 2,
    marginLeft: 8,
  },
  mdLink: {
    color: '#4a9eff',
    textDecorationLine: 'underline' as const,
  },
  mdBlockquote: {
    backgroundColor: 'rgba(192, 192, 255, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#C0C0FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderRadius: 4,
  },
  mdBlockquoteText: {
    color: '#C0C0FF',
    fontSize: 15,
    fontStyle: 'italic' as const,
    lineHeight: 22,
  },
  codeBlockHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  codeLanguage: {
    color: '#C0C0FF',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  copyButton: {
    padding: 4,
  },
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c1f' },
  backgroundOrbs: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  floatingOrb: { 
    position: 'absolute', 
    shadowColor: '#8a4cff', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 20 
  },
  keyboardAvoidingView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4b',
  },
  menuButton: { 
    padding: 8, 
  },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: '500', 
    marginLeft: 10,
    fontFamily: 'Orbitron-Black',
  },
  clearButton: { 
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageList: { flex: 1 },
  messageRow: { flexDirection: 'row', marginVertical: 8, alignItems: 'flex-end' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a4b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: screen.width * 0.75,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userBubble: {
    backgroundColor: '#4a4af5',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#2a2a4b',
    borderBottomLeftRadius: 5,
    minHeight: 45,
    justifyContent: 'center',
  },
  messageText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  messageFileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFileName: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4b',
  },
  attachButton: {
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e1e3f',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
    maxHeight: 120,
    color: '#FFF',
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a4af5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a4af5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
  },
  sendButtonDisabled: { opacity: 0.6 },
  fileAttachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e3f',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4b',
  },
  fileAttachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileAttachmentName: {
    color: '#C0C0FF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  fileAttachmentSize: {
    color: '#6a6a8b',
    fontSize: 12,
    marginLeft: 8,
  },
  fileAttachmentRemove: {
    padding: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c0c0ff',
    marginHorizontal: 3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  errorText: { color: '#ff6b6b', fontSize: 14, marginLeft: 8, flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#C0C0FF', fontSize: 16, marginTop: 12 },

  // Welcome Modal Styles
  welcomeModalContent: {
    backgroundColor: '#1e1e3f',
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  welcomeBody: {
    marginBottom: 24,
  },
  welcomeText: {
    color: '#C0C0FF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  setupSteps: {
    gap: 24,
  },
  setupStep: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a4af5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#C0C0FF',
    fontSize: 14,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  linkButtonText: {
    color: '#4a9eff',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 192, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  infoText: {
    color: '#C0C0FF',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  getStartedButton: {
    backgroundColor: '#4a4af5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4a4af5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e3f',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#C0C0FF',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOptions: {
    gap: 12,
  },
  modalOption: {
    backgroundColor: '#2a2a4b',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  modalOptionDestructive: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  modalOptionCancel: {
    backgroundColor: '#2a2a4b',
  },
  modalOptionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOptionTextDestructive: {
    color: '#ff6b6b',
  },
  modalOptionTextCancel: {
    color: '#C0C0FF',
  },

  // Settings Modal Styles
  settingsModalContent: {
    backgroundColor: '#1e1e3f',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  settingsHint: {
    color: '#6a6a8b',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  getApiKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 158, 255, 0.3)',
  },
  getApiKeyText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsInput: {
    backgroundColor: '#0c0c1f',
    borderWidth: 1,
    borderColor: '#2a2a4b',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  showKeyButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 8,
  },
  showKeyText: {
    color: '#C0C0FF',
    fontSize: 13,
    fontWeight: '500',
  },
  settingsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsCancelButton: {
    backgroundColor: '#2a2a4b',
  },
  settingsSaveButton: {
    backgroundColor: '#4a4af5',
  },
  settingsCancelText: {
    color: '#C0C0FF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSaveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Sidebar Styles
  sidebarOverlay: {
    flex: 1,
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarContent: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#0c0c1f',
    height: '100%',
    position: 'absolute',
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 18.3,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4b',
  },
  sidebarTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    paddingTop: 25,
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontFamily: 'Orbitron-Black',
  },
  sidebarCloseButton: {
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 34,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a4af5',
    margin: 16,
    padding: 16,
    borderRadius: 15,
    shadowColor: '#4a4af5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newConversationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  conversationList: {
    flex: 1,
    paddingTop: 8,
  },
  emptyConversations: {
    padding: 40,
    alignItems: 'center',
  },
  emptyConversationsText: {
    color: '#6a6a8b',
    fontSize: 14,
  },
  conversationItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  conversationItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  conversationItemActive: {
    backgroundColor: '#2a2a4b',
  },
  conversationItemText: {
    flex: 1,
    marginLeft: 12,
  },
  conversationItemTitle: {
    color: '#C0C0FF',
    fontSize: 15,
    fontWeight: '500',
  },
  conversationItemTitleActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  conversationItemDate: {
    color: '#6a6a8b',
    fontSize: 12,
    marginTop: 2,
  },
  deleteConversationButton: {
    padding: 8,
  },
  settingsButtonSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a4b',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a5b',
  },
  settingsButtonText: {
    color: '#C0C0FF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  ...markdownStyles,
});

export default GigiChatbotScreen;
